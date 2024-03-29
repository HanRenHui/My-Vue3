import { reactive, ReactiveEffect } from '@vue3/reactivity'
import { invokeFns, PatchFlags, ShapeFlags } from '@vue3/shared'
import patchClass from 'packages/runtime-dom/src/module/class'
import { LifecycleHooks } from './apiLifecycle'
import {
  createComponentInstance,
  hasPropChanged,
  setupComponent,
  updateProps
} from './component'
import { queueJob } from './queue'
import { createVNode, isSameVnode } from './vnode'

export const Text = Symbol.for('Text')
export const Fragment = Symbol.for('Fragment')

export function createRenderer(renderOptions) {
  const {
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

  const mountChildren = (container, children, parent) => {
    children.forEach((child, i) => {
      patch(null, child, container, null, parent)
    })
  }

  const mountElement = (vnode, container, anchor = null, parent) => {
    vnode.el = hostCreateElement(vnode.type)
    for (const key in vnode.props) {
      hostPatchProp(vnode.el, key, null, vnode.props[key])
    }
    if (vnode.ShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.el, vnode.children, parent)
    } else if (vnode.ShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(vnode.el, vnode.children)
    }
    hostInsert(vnode.el, container, anchor)
  }

  const patchProps = (el, preProps, nextProps) => {
    for (const key in nextProps) {
      hostPatchProp(el, key, preProps[key], nextProps[key])
    }

    for (const key in preProps) {
      if (!nextProps[key]) {
        hostPatchProp(el, key, preProps[key], null)
      }
    }
  }

  const unmountChildren = (vnode) => {
    vnode.children.forEach((child) => {
      unmount(child)
    })
  }

  // 获取最长子增子序列的下标 [3, 4, 7， 9, 5]
  function getSequce(arr) {
    const rs = [0]
    const prefix = new Array(arr.length).fill(undefined)

    for (let i = 1; i < arr.length; i++) {
      if (arr[i] === 0) {
        continue
      }
      const lastIndex = rs[rs.length - 1]
      const cur = arr[i]
      if (cur > arr[lastIndex]) {
        prefix[i] = lastIndex
        rs.push(i)
      } else {
        let start = 0
        let end = rs.length - 1
        let mid = Math.floor((end + start) / 2)
        while (start < end) {
          if (arr[rs[mid]] < cur) {
            start = mid + 1
          } else {
            end = mid
          }
          mid = Math.floor((end + start) / 2)
        }

        if (arr[rs[start]] > cur) {
          prefix[i] = rs[start - 1]
          rs[start] = i
        }
      }
    }
    let i = rs.length - 1
    let last = rs[i]
    while (i) {
      rs[i] = last
      last = prefix[last]
      i--
    }
    return rs
  }

  const patchKeyedChildren = (el, n1, n2, parent) => {
    const c1 = n1.children
    const c2 = n2.children
    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    // 跳过前序相同的
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el)
        i++
      } else {
        break
      }
    }
    // 跳过后序相同的
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el)
        e1--
        e2--
      } else {
        break
      }
    }
    // 同序列新增
    // 如果 i 大于 e1 说明有新增的, i跟e2之间的节点就是要新增的
    if (i > e1) {
      while (i <= e2) {
        const nextIndex = e2 + 1
        const anchor = nextIndex < c2.length ? c2[nextIndex].el : null
        patch(null, c2[i++], el, anchor, parent)
      }
    }

    // 同序列删除
    // 如果i 大于 e2 说明  有要删除的 i跟e1之间的节点就是要删除的
    if (i > e2) {
      while (i <= e1) {
        unmount(c1[i++])
      }
    }

    // 优化完毕 开始乱序比对
    // 新的key值和下标的映射表
    const newKeyMap = {}
    const s1 = i
    const s2 = i
    for (let i = s2; i <= e2; i++) {
      const cur = c2[i]
      newKeyMap[cur.key] = i
    }
    // 遍历老children 标记需要移动的， 以及删除多余的
    const toBePatched = e2 - s2 + 1
    // 下标是在新数组里的位置，对应的值是在旧数组里的位置
    const patchedArr = new Array(toBePatched).fill(0)
    for (let i = s1; i <= e1; i++) {
      const newIndex = newKeyMap[c1[i].key]
      if (newIndex === undefined) {
        // 在新children 没找到 则要删除
        unmount(c1[i])
      } else {
        // patchedMap[newIndex] = i+1
        patchedArr[newIndex - s2] = i + 1
        const anchor = newIndex + 1 < c2.length ? c2[newIndex + 1] : null
        patch(c1[i], c2[newIndex], el, anchor, parent)
      }
    }
    // 获取最长递增子序列 存的是下标
    const longestPatchedArr = getSequce(patchedArr)
    let j = longestPatchedArr.length - 1

    // 该移动的移动 该新增的新增
    for (let i = patchedArr.length - 1; i >= 0; i--) {
      const index = i + s2
      const current = c2[index]
      const anchor = index + 1 < c2.length ? c2[index + 1].el : null
      if (patchedArr[i] === 0) {
        patch(null, c2[index], el, anchor, parent)
      } else {
        if (i !== longestPatchedArr[j]) {
          hostInsert(current.el, el, anchor)
        } else {
          j--
          // 没动
          console.log('没动', current.key)
        }
      }
    }
  }

  const patchChildren = (el, n1, n2, parent) => {
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
          patchKeyedChildren(el, n1, n2, parent)
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
          mountChildren(el, c2, parent)
        }
        // hostSetElementText(el, null)
      }
    }
  }

  const patchBlockChildren = (n1, n2, parent) => {
    for (let i = 0; i < n2.dynamicChildren.length; i++) {
      patchElement(n1.dynamicChildren[i], n2.dynamicChildren[i], parent)
    }
  }

  const patchElement = (n1, n2, parent) => {
    const el = (n2.el = n1.el)
    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    const { patchFlag } = n2
    if (patchFlag & PatchFlags.CLASS) {
      // 只有class是动态的
      if (oldProps.class !== newProps.class) {
        // patchClass(el, newProps.class)
        hostPatchProp(el, 'class', oldProps.class, newProps.class)
      }
    } else if (patchFlag & PatchFlags.STYLE) {
      // 只有style是动态的
      if (oldProps.style !== newProps.style) {
        hostPatchProp(el, 'style', oldProps.style, newProps.style)
      }
    } else {
      patchProps(el, n1.props, n2.props)
    }
    if (n2.dynamicChildren) {
      // 靶向更新
      patchBlockChildren(n1, n2, parent)
    } else {
      patchChildren(el, n1, n2, parent)
    }
  }

  const processElement = (n1, n2, container, anchor = null, parent) => {
    if (!n1) {
      mountElement(n2, container, anchor, parent)
    } else {
      patchElement(n1, n2, parent)
    }
  }

  const processtext = (n1, n2, container) => {
    if (!n1) {
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    } else if (n1.children !== n2.children) {
      const el = (n2.el = n1.el)
      hostSetText(el, n2.children)
    }
  }

  const processFragment = (n1, n2, container, parent) => {
    if (!n1) {
      mountChildren(container, n2.children, parent)
    } else {
      patchChildren(container, n1, n2, parent)
    }
  }

  const updateComponentPreRender = (instance, nextVNode) => {
    instance.next = null
    updateProps(instance.props, nextVNode.props)
    instance.slots = nextVNode.children
  }

  const setupRenderEffect = (instance, container, anchor) => {
    const updateComponentFn = () => {
      if (!instance.is_mounted) {
        invokeFns(instance[LifecycleHooks.BEFORE_MOUNT])
        // mount 挂载
        instance.subTree = instance.render.call(instance.proxy)
        patch(null, instance.subTree, container, anchor, instance)
        invokeFns(instance[LifecycleHooks.MOUNTED])
        instance.is_mounted = true
      } else {
        if (instance.next) {
          const next = instance.next
          updateComponentPreRender(instance, next)
        }
        // 更新
        const subTree = instance.render.call(instance.proxy)
        invokeFns(instance[LifecycleHooks.BEFORE_UPDAT])
        patch(instance.subTree, subTree, container, anchor)
        invokeFns(instance[LifecycleHooks.UPDATED])
        instance.subTree = subTree
      }
    }

    const effect = new ReactiveEffect(updateComponentFn, () =>
      queueJob(updateComponentFn)
    )
    instance.update = effect.run.bind(effect)
    instance.update()
  }

  const mountComponent = (vnode, container, anchor, parent) => {
    const instance = (vnode.component = createComponentInstance(vnode, parent))

    // 设置组件实例属性
    setupComponent(instance)

    setupRenderEffect(instance, container, anchor)
  }

  const shouldUpdateComponent = (n1, n2) => {
    return hasPropChanged(n1.props, n2.props)
  }

  const updateComponent = (n1, n2) => {
    // 继承组件实例
    const instance = (n2.component = n1.component)
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2
      instance.update()
    }
  }

  const processComponent = (n1, n2, container, anchor, parent) => {
    if (!n1) {
      mountComponent(n2, container, anchor, parent)
    } else {
      updateComponent(n1, n2)
    }
  }

  const patch = (n1, n2, container, anchor = null, parent?) => {
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1)
      n1 = null
    }
    switch (n2.type) {
      case Text:
        processtext(n1, n2, container)
        break
      case Fragment:
        processFragment(n1, n2, container, parent)
        break
      default:
        if (n2.ShapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parent)
        } else if (n2.ShapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, anchor, parent)
        }
        break
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
