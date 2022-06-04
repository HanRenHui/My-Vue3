import nodeOps from './nodeOps'
import { patchProp } from './patchProp'
import { createRenderer } from '@vue3/runtime-core'
export * from '@vue3/runtime-core'
export * from '@vue3/reactivity'
export * from './patchProp'
const renderOptons = Object.assign(nodeOps, { patchProp})

// createRenderer(renderOptons).render()

export function render(vnode, container) {
    createRenderer(renderOptons).render(vnode, container)
}