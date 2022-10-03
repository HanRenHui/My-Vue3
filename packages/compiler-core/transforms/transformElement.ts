import { NodeTypes } from '../src/ast'

const isText = (node) => {
  return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION
}

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    console.log('in element', node.tag)

    return () => {
      console.log('out element', node.tag)
    }
  }
}
