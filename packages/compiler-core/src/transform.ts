import { transformElement } from './transforms/transformElement'
import { transformExpression } from './transforms/transformExpression'
import { transformText } from './transforms/transformText'
import { createVnodeCall, NodeTypes } from './ast'
import { CREATE_BLOCK_VNODE, CREATE_ELEMENT_VNODE, FRAGEMENT, OPEN_BLOCK, TO_DISPLAY_STRING } from './runtimeHelpers'

function createTransformContext() {
  const context = {
    parent: null,
    currentNode: null,
    helpers: new Map(),
    helper(name) {
      const count = context.helpers.get(name) || 0
      context.helpers.set(name, count + 1)
      return name
    },
    removeHelper(name) {
      let count = context.helpers.get(name)
      count--
      if (count) {
        context.helpers.set(name, count)
      } else {
        context.helpers.delete(count)
      }
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

function createRootCodegen(ast, context) {
  const children = ast.children
  if (children.length === 1) {
    const child = children[0]
    if (child.type === NodeTypes.ELEMENT && child.codegenNode) {
      ast.codegenNode = child.codegenNode
      ast.codegenNode.isBlock = true
      context.removeHelper(CREATE_ELEMENT_VNODE)
      context.helper(OPEN_BLOCK)
      context.helper(CREATE_BLOCK_VNODE)
    } else {
      ast.codegenNode = child.codegenNode
    }
  } else {
    if (!children.length) return null
    context.helper(FRAGEMENT)
    ast.codegenVnode = createVnodeCall(context, FRAGEMENT, null, ast.children)
  }
}
export function transform(ast) {
  const context = createTransformContext()
  traverse(ast, context)
  createRootCodegen(ast, context)
  ast.helpers = [...context.helpers.keys()]
  return ast
}
