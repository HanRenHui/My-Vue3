import { createObjectExpression, createVnodeCall, NodeTypes } from '../ast'

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // console.log('out element', node.tag)
      const props = node.props || {}
      const propirties = []
      for (let i = 0; i < props.length; i++) {
        const p = props[i]
        propirties.push({
          key: p.name,
          value: JSON.stringify(p.value.content)
        })
      }

      const propertyExpression = propirties.length ? createObjectExpression(propirties) : null

      let childrenNodes = null
      if (node.children.length === 1) {
        childrenNodes = node.children[0]
      } else {
        childrenNodes = node.children
      }

      node.codegenNode = createVnodeCall(context, JSON.stringify(node.tag), propertyExpression, childrenNodes)
    }
  }
}
