import { createObjectExpression, createVnodeCall, NodeTypes } from '../src/ast'

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // console.log('out element', node.tag)
      const props = node.props || {}
      const propirties = []
      for (const key in props) {
        const value = props[key]
        propirties.push({
          key,
          value: value.content
        })
      }

      const propertyExpression = propirties.length ? createObjectExpression(propirties) : null

      let childrenNodes = null
      if (node.children.length === 1) {
        childrenNodes = node.children[0]
      } else {
        childrenNodes = node.children
      }

      node.codegenNode = createVnodeCall(context, node.tag, propertyExpression, childrenNodes)
    }
  }
}
