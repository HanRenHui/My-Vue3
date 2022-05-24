import { ShapeFlags } from '@vue3/shared'

export function createVNode(type, props, children) {
    let ShapeFlag = 0
    let vnode = {
        __v_isVnode: true,
        type,
        props,
        ShapeFlag,
        children,
        key: props?.key
    }
    delete props.key
    if (typeof type === 'string') {
        vnode.ShapeFlag = ShapeFlags.ELEMENT
    }

    if (children) {
        let type = 0
        if (Array.isArray(children)) {
            type = ShapeFlags.ARRAY_CHILDREN
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