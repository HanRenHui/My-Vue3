import nodeOps from './nodeOps'
import { patchProp } from './patchProp'

const renderOptons = Object.assign(nodeOps, { patchProp})

// createRenderer(renderOptons).render()


export function createRenderer(renderOptions) {
    return {
        render(vnode, container) {
            
        }
    }

}

export function render(vnode, container) {
    createRenderer(renderOptons).render(vnode, container)
}