import { createVNode } from './vnode'

export function h(type, props, children) {
    if (!Array.isArray(children)) children = [children]
    return createVNode(type, props, children)
}