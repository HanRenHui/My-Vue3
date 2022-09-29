import { createVNode, isVnode } from './vnode'
import { isArray, isObject } from '@vue3/shared'
export function h(type, props, children) {
  const l = arguments.length
  if (l === 2) {
    if (isObject(props)) {
      if (!isArray(props)) {
        if (isVnode(props)) {
          return createVNode(type, null, [props])
        } else {
          return createVNode(type, props)
        }
      } else {
        return createVNode(type, null, props)
      }
    } else {
      return createVNode(type, null, props)
    }
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2)
    } else if (l === 3 && isVnode(children)) {
      children = [children]
    }
    return createVNode(type, props, children)
  }
}
