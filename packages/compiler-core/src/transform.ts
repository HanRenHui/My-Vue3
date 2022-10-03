import { transformElement } from '../transforms/transformElement'
import { transformExpression } from '../transforms/transformExpression'
import { transformText } from '../transforms/transformText'
import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING } from './runtimeHelpers'

function createTransformContext() {
  const context = {
    parent: null,
    currentNode: null,
    helpers: new Map(),
    helper(name) {
      const count = context.helpers.get(name) || 0
      context.helpers[name] = count + 1
    },
    nodeTransforms: [transformElement, transformText, transformExpression]
  }

  return context
}

function traverse(ast, context) {
  const currentNode = (context.currentNode = ast)
  const transforms = context.nodeTransforms
  const exitFns = []
  for (let i = 0; i < transforms.length; i++) {
    const exitFn = transforms[i](ast, context)
    if (typeof exitFn === 'function') {
      exitFns.push(exitFn)
    }
  }

  switch (currentNode.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      const children = currentNode.children
      for (let i = 0; i < children.length; i++) {
        traverse(children[i], context)
      }
  }

  context.currentNode = ast
  let i = 0
  while (i < exitFns.length) {
    exitFns[i]()
    i++
  }
}

export function transform(ast) {
  const context = createTransformContext()
  traverse(ast, context)
}
