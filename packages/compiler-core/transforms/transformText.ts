import { PatchFlags } from '@vue3/shared'
import { createCallExpression, NodeTypes } from '../src/ast'
function isText(node) {
  return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION
}
export function transformText(node, context) {
  if (node.type === NodeTypes.ROOT || node.type === NodeTypes.ELEMENT) {
    // do something
    return () => {
      // 合并普通文本子节点和表达式节点
      const children = node.children
      // 标记是否有文本子节点
      let hasText = false
      for (let i = 0; i < children.length; i++) {
        const curChildren = children[i]
        let currentContainer = null
        if (isText(curChildren)) {
          hasText = true
          // 查找连续子节点
          for (let j = i + 1; j < children.length; j++) {
            const nextChildren = children[j]
            if (isText(nextChildren)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [curChildren]
                }
              }
              currentContainer.children.push(`+`, nextChildren)
              children.splice(j, 1)
              j--
            } else {
              currentContainer = null
              break
            }
          }
        }
      }

      // 为ast节点添加codegennode generate阶段需要handlerCloudStorage

      if (!hasText || children.length === 1) {
        return
      }

      for (let i = 0; i < children.length; i++) {
        const curChild = children[i]
        const args = [curChild]
        if (isText(curChild) || curChild.type === NodeTypes.COMPOUND_EXPRESSION) {
          if (curChild.type !== NodeTypes.TEXT) {
            // 说明是动态节点 需要 传入patchFlags 做靶向更新
            args.push(PatchFlags.TEXT)
          }
          children[i] = {
            type: NodeTypes.TEXT_CALL, // 需要调用createTextNode
            content: curChild,
            codegenNode: createCallExpression(context, args)
          }
        }
      }
    }
  }
}
