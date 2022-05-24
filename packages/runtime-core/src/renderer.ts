import { ShapeFlags } from "@vue3/shared"
import { onUnmounted } from "vue"
import { createVNode, isSameVnode } from "./vnode"

export const Text = Symbol.for('Text')

export function createRenderer(renderOptions) {
    let {
        // 增删改查
        insert: hostInsert,
        createElement: hostCreateElement,
        createText: hostCreateText,
        remove: hostRemove,
        setElementText: hostSetElementText,
        setText: hostSetText,
        querySelector: hostQuerySelector,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
        patchProp: hostPatchProp
    } = renderOptions

    const mountChildren = (container, children) => {
        children.forEach((child, i) => {
            if (typeof child === 'string') {
                children[i] = createVNode(Text, {}, child)
            }
            patch(null, children[i], container)
        })
    }

    const mountElement = (vnode, container, anchor = null) => {
        vnode.el = hostCreateElement(vnode.type)
        for (let key in vnode.props) {
            hostPatchProp(vnode.el, key, null, vnode.props[key])
        }
        if (vnode.ShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode.el, vnode.children)
        } else  if (vnode.ShapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(vnode.el, vnode.children)
        }
        hostInsert(vnode.el, container, anchor)
    }

    const patchProps = (el, preProps, nextProps) => {
        for (let key in nextProps) {
            hostPatchProp(el, key, preProps[key], nextProps[key])
        }

        for (let key in preProps) {
            if (!nextProps[key]) {
                hostPatchProp(el, key, preProps[key], null)
            }

        }
    }

    const unmountChildren = vnode => {
        vnode.children.forEach(child => {
            unmount(child)
        })
    }

    const patchKeyedChildren = (el, n1, n2) => {
        const c1 = n1.children
        const c2 = n2.children
        
        let i = 0 
        let e1 = c1.length - 1
        let e2 = c2.length - 1
        // 跳过前序相同的
        while(i <= e1 && i <= e2) {
            const n1 = c1[i]
            const n2 = c2[i]
            if (isSameVnode(n1, n2)) {
                patch(n1, n2, el)
                i ++
            } else {
                break;
            }
        }

        // 跳过后序相同的
        while(i <= e1 && i <= e2) {
            const n1 = c1[e1]
            const n2 = c2[e2]
            if (isSameVnode(n1, n2)) {
                patch(n1, n2, el)
                e1 --
                e2 --
            } else {
                break;
            }
        }
        // 同序列新增
        // 如果 i 大于 e1 说明有新增的, i跟e2之间的节点就是要新增的
        if (i > e1) {
            while(i <= e2) {
                const nextIndex = e2 + 1
                const anchor = nextIndex < c2.length ? c2[nextIndex].el : null
                patch(null, c2[i++], el, anchor)
            }
        }

        // 同序列删除
        // 如果i 大于 e2 说明  有要删除的 i跟e1之间的节点就是要删除的
        if (i > e2) {
            while(i <= e1) {
                unmount(c1[i++])
            }
        }
    }

    const patchChildren = (el, n1, n2) => {
        const shapeFlag = n2.ShapeFlag
        const preShapeFlag = n1.ShapeFlag
        const c1 = n1.children 
        const c2 = n2.children
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 现在是文本
            if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 之前有儿子
                unmountChildren(n1)
            }
            if (c1 !== c2) {
                hostSetElementText(el, c2)
            }
        } else {
            // 现在是数组或空
            if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 之前是数组 现在也是数组 diff算法               
                    patchKeyedChildren(el, n1, n2)
                } else {
                    // 之前是数组 现在是空
                    unmountChildren(n1)
                }
            } else {
                // 之前是文本
                if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                    hostSetElementText(el, '')
                }
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    mountChildren(el, c2)
                }
                // hostSetElementText(el, null)
            }
        }

    }

    const patchElement = ( n1, n2) => {
        const el = n2.el = n1.el
        patchProps(el, n1.props, n2.props)
        patchChildren(el, n1, n2)
    }

    const processElement = (n1, n2, container, anchor = null) => {
        if (!n1) {
            mountElement(n2, container, anchor)
        } else {
            patchElement(n1, n2)
        }
    }

    const processText = (n1, n2, container) => {
        if (!n1) {
            hostInsert(n2.el = hostCreateText(n2.children), container)
        } else if (n1.children !== n2.children) {
            const el = n2.el = n1.el
            hostSetText(el, n2.children)
        }
    }

    const patch = (n1, n2, container, anchor = null) => {
        if (n1 && !isSameVnode(n1, n2)) {
            unmount(n1)
            n1 = null
        }
        switch(n2.type) {
            case Text:
                processText(n1, n2, container)
                break;
            default :
                processElement(n1, n2, container, anchor)
                break;
        }
    }

    const unmount = (vnode) => {
        hostRemove(vnode.el)
    }

    const render = (vnode, container) => {
        if (!vnode) {
            // 卸载
            container._vnode && unmount(container._vnode)
        } else {
            patch(container._vnode || null, vnode, container)
        }

        container._vnode = vnode
    }

    return {
        render
    }
}
