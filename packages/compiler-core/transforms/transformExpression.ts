import { NodeTypes } from '../src/ast'

export function transformExpression(node, context) {
  if (node.type === NodeTypes.INTERPOLATION) {
    const content = node.content.content
    node.content.content = `_ctx.${content}`
  }
}
