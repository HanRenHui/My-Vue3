import { ShapeFlags, isObject } from '@vue3/shared'

export function createVNode(type, props: any = {}, children = [], patchFlag?) {
  const ShapeFlag = 0
  const vnode = {
    __v_isVnode: true,
    type,
    props,
    ShapeFlag,
    children,
    key: props?.key,
    patchFlag
  }
  if (props?.key) {
    delete props.key
  }
  if (typeof type === 'string') {
    vnode.ShapeFlag = ShapeFlags.ELEMENT
  } else if (typeof type === 'object') {
    vnode.ShapeFlag = ShapeFlags.STATEFUL_COMPONENT
  }

  if (children !== undefined) {
    let type = 0
    if (Array.isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN
    } else if (isObject(children)) {
      type = ShapeFlags.SLOTS_CHILDREN
    } else {
      type = ShapeFlags.TEXT_CHILDREN
    }
    vnode.ShapeFlag |= type
  }

  if (currentBlock && patchFlag) {
    currentBlock.push(vnode)
  }
  return vnode
}
export const isVnode = (vnode) => vnode.__v_isVnode

export { createVNode as createElementVNode }

export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}
let currentBlock = null
export function openBlock() {
  currentBlock = []
}
function setupBlock(vnode) {
  // 使用完要重置
  vnode.dynamicChildren = currentBlock

  currentBlock = null
  return vnode
}
export function createElementBlock(type, props, children, patchFlag) {
  const vnode = createVNode(type, props, children, patchFlag)
  setupBlock(vnode)
  return vnode
}
export function toDisplayString(val) {
  if (typeof val === 'string') return val
  return JSON.stringify(val)
}
