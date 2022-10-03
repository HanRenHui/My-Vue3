import { NodeTypes } from '../src/ast'

export function transformText(node, context) {
  if (node.type === NodeTypes.TEXT) {
    console.log('in text', node)
    return () => {
      console.log('out text', node)
    }
  }
  if (node.type === NodeTypes.ROOT || node.type === NodeTypes.ELEMENT) {
    // do something
    // return () => {}
  }
}
