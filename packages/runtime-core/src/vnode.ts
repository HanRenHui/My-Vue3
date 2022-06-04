import { ShapeFlags, IsObject } from '@vue3/shared'

export function createVNode(type, props: any = {}, children) {
    let ShapeFlag = 0
    let vnode = {
        __v_isVnode: true,
        type,
        props,
        ShapeFlag,
        children,
        key: props.key
    }
    delete props.key
    if (typeof type === 'string') {
        vnode.ShapeFlag = ShapeFlags.ELEMENT
    } else if (typeof type === 'object') {
        vnode.ShapeFlag = ShapeFlags.STATEFUL_COMPONENT
    }

    if (children) {
        let type = 0
        if (Array.isArray(children)) {
            type = ShapeFlags.ARRAY_CHILDREN
        } else if (IsObject(children)) {
            type = ShapeFlags.SLOTS_CHILDREN
        } else {
            type = ShapeFlags.TEXT_CHILDREN
        }
        vnode.ShapeFlag |= type
    }
    return vnode
}

export function isSameVnode (n1, n2) {
    return n1.type === n2.type && n1.key === n2.key
}