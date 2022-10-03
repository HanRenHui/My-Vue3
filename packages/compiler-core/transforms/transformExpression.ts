import { NodeTypes } from '../src/ast'

export function transformExpression(node, context) {
  if (node.type === NodeTypes.INTERPOLATION) {
    console.log('in expression', node)
    const content = node.content.content
    node.content.content = `_ctx.${content}`
    return () => {
      console.log('out expression', node)
    }
  }
}
