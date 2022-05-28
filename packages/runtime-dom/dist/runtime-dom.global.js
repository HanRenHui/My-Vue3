var VueRuntimedom = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/runtime-dom/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Fragment: () => Fragment,
    Text: () => Text,
    createRenderer: () => createRenderer,
    h: () => h,
    patchProp: () => patchProp,
    render: () => render
  });

  // packages/runtime-dom/src/nodeOps.ts
  var nodeOps_default = {
    insert(child, parent, anchor = null) {
      parent.insertBefore(child, anchor);
    },
    createElement(tagName) {
      return document.createElement(tagName);
    },
    createText(text) {
      return document.createTextNode(text);
    },
    remove(child) {
      const parentNode = child.parentNode;
      if (parentNode) {
        parentNode.removeChild(child);
      }
    },
    setElementText(el, text) {
      el.textContent = text;
    },
    setText(node, text) {
      node.nodeValue = text;
    },
    querySelector(selector) {
      return document.querySelector(selector);
    },
    parentNode(node) {
      return node.parentNode;
    },
    nextSibling(node) {
      return node.nextSibling;
    }
  };

  // packages/runtime-dom/src/module/class.ts
  function patchClass(el, newValue) {
    if (!newValue)
      return el.removeAttribute("class");
    el.className = newValue;
  }

  // packages/runtime-dom/src/module/style.ts
  function patchStyle(el, oldValue, newValue) {
    for (let key in newValue) {
      el.style[key] = newValue[key];
    }
    if (!oldValue)
      return;
    for (let key in oldValue) {
      if (!newValue[key]) {
        el.style[key] = null;
      }
    }
  }

  // packages/runtime-dom/src/module/event.ts
  function createInvoker(callback) {
    const invoker = (e) => invoker.value(e);
    invoker.value = callback;
    return invoker;
  }
  function patchEvent(el, eventName, callback) {
    const _store = el._store || (el._store = {});
    let exsit = _store[eventName];
    const event = eventName.slice(2).toLowerCase();
    if (exsit) {
      exsit.value = callback;
      if (!callback) {
        el.removeEventListener(event, exsit);
        _store[eventName] = void 0;
      }
    } else {
      const invoker = _store[eventName] = createInvoker(callback);
      el.addEventListener(event, invoker);
    }
  }

  // packages/runtime-dom/src/module/attr.ts
  function attr(el, key, nextValue) {
    if (!nextValue) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(el, key, nextValue);
    }
  }

  // packages/runtime-dom/src/patchProp.ts
  function patchProp(el, key, preValue, nextValue) {
    if (key === "class") {
      patchClass(el, nextValue);
    } else if (key === "style") {
      patchStyle(el, preValue, nextValue);
    } else if (/^on[^a-z][a-z]+/.test(key)) {
      patchEvent(el, key, nextValue);
    } else {
      attr(el, key, nextValue);
    }
  }

  // packages/reactivity/src/effect.ts
  var activeEffect;
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.parent = void 0;
      this.active = true;
      this.deps = [];
    }
    run() {
      if (!this.active)
        return this.fn();
      this.parent = activeEffect;
      activeEffect = this;
      cleanupEffect(this);
      const v = this.fn();
      activeEffect = this.parent;
      return v;
    }
    stop() {
      this.active = false;
      cleanupEffect(this);
    }
  };
  function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
      dep.delete(effect);
    });
    effect.deps.length = 0;
  }

  // packages/reactivity/src/reactive.ts
  var cache = /* @__PURE__ */ new WeakMap();
  function reactive(target) {
    if (cache.get(target))
      return cache.get(target);
    if (target.is_reactive) {
      return target;
    }
    const proxy = new Proxy(target, {
      get(target2, key, recevier) {
        if (key === "is_reactive") {
          return true;
        }
        track(target2, key);
        return Reflect.get(target2, key, recevier);
      },
      set(target2, key, value, recevier) {
        let rs = Reflect.set(target2, key, value, recevier);
        trigger(target2, key);
        return rs;
      }
    });
    cache.set(target, proxy);
    return proxy;
  }
  var map = /* @__PURE__ */ new WeakMap();
  function track(target, key) {
    let depMap = map.get(target);
    if (!depMap) {
      map.set(target, depMap = /* @__PURE__ */ new Map());
    }
    let deps = depMap.get(key);
    if (!deps) {
      depMap.set(key, deps = /* @__PURE__ */ new Set());
    }
    if (!deps.has(activeEffect) && activeEffect) {
      deps.add(activeEffect);
    }
    activeEffect && activeEffect.deps.push(deps);
  }
  function trigger(target, key) {
    const depMap = map.get(target);
    if (!depMap)
      return;
    const deps = depMap.get(key);
    if (!deps)
      return;
    new Set(deps).forEach((dep) => {
      if (dep.scheduler) {
        dep.scheduler();
      } else {
        dep.run();
      }
    });
  }

  // packages/runtime-core/src/queue.ts
  var queue = [];
  var flushing = false;
  var p = Promise.resolve();
  function queueJob(job) {
    if (queue.includes(job)) {
      return;
    } else {
      queue.push(job);
    }
    if (!flushing) {
      flushing = true;
      p.then(() => {
        let copy = queue.slice(0);
        copy.forEach((c) => c());
        queue.length = 0;
        copy = [];
        flushing = false;
      });
    }
  }

  // packages/runtime-core/src/vnode.ts
  function createVNode(type, props = {}, children) {
    let ShapeFlag = 0;
    let vnode = {
      __v_isVnode: true,
      type,
      props,
      ShapeFlag,
      children,
      key: props.key
    };
    delete props.key;
    if (typeof type === "string") {
      vnode.ShapeFlag = 1 /* ELEMENT */;
    } else if (typeof type === "object") {
      vnode.ShapeFlag = 4 /* STATEFUL_COMPONENT */;
    }
    if (children) {
      let type2 = 0;
      if (Array.isArray(children)) {
        type2 = 16 /* ARRAY_CHILDREN */;
      } else {
        type2 = 8 /* TEXT_CHILDREN */;
      }
      vnode.ShapeFlag |= type2;
    }
    return vnode;
  }
  function isSameVnode(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }

  // packages/runtime-core/src/renderer.ts
  var Text = Symbol.for("Text");
  var Fragment = Symbol.for("Fragment");
  function createRenderer(renderOptions) {
    let {
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
    } = renderOptions;
    const mountChildren = (container, children) => {
      children.forEach((child, i) => {
        patch(null, child, container);
      });
    };
    const mountElement = (vnode, container, anchor = null) => {
      vnode.el = hostCreateElement(vnode.type);
      for (let key in vnode.props) {
        hostPatchProp(vnode.el, key, null, vnode.props[key]);
      }
      if (vnode.ShapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(vnode.el, vnode.children);
      } else if (vnode.ShapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(vnode.el, vnode.children);
      }
      hostInsert(vnode.el, container, anchor);
    };
    const patchProps = (el, preProps, nextProps) => {
      for (let key in nextProps) {
        hostPatchProp(el, key, preProps[key], nextProps[key]);
      }
      for (let key in preProps) {
        if (!nextProps[key]) {
          hostPatchProp(el, key, preProps[key], null);
        }
      }
    };
    const unmountChildren = (vnode) => {
      vnode.children.forEach((child) => {
        unmount(child);
      });
    };
    function getSequce(arr) {
      const rs = [0];
      const prefix = new Array(arr.length).fill(void 0);
      for (let i2 = 1; i2 < arr.length; i2++) {
        if (arr[i2] === 0) {
          continue;
        }
        let lastIndex = rs[rs.length - 1];
        const cur = arr[i2];
        if (cur > arr[lastIndex]) {
          prefix[i2] = lastIndex;
          rs.push(i2);
        } else {
          let start = 0;
          let end = rs.length - 1;
          let mid = Math.floor((end + start) / 2);
          while (start < end) {
            if (arr[rs[mid]] < cur) {
              start = mid + 1;
            } else {
              end = mid;
            }
            mid = Math.floor((end + start) / 2);
          }
          if (arr[rs[start]] > cur) {
            prefix[i2] = rs[start - 1];
            rs[start] = i2;
          }
        }
      }
      let i = rs.length - 1;
      let last = rs[i];
      while (i) {
        rs[i] = last;
        last = prefix[last];
        i--;
      }
      return rs;
    }
    const patchKeyedChildren = (el, n1, n2) => {
      const c1 = n1.children;
      const c2 = n2.children;
      let i = 0;
      let e1 = c1.length - 1;
      let e2 = c2.length - 1;
      while (i <= e1 && i <= e2) {
        const n12 = c1[i];
        const n22 = c2[i];
        if (isSameVnode(n12, n22)) {
          patch(n12, n22, el);
          i++;
        } else {
          break;
        }
      }
      while (i <= e1 && i <= e2) {
        const n12 = c1[e1];
        const n22 = c2[e2];
        if (isSameVnode(n12, n22)) {
          patch(n12, n22, el);
          e1--;
          e2--;
        } else {
          break;
        }
      }
      if (i > e1) {
        while (i <= e2) {
          const nextIndex = e2 + 1;
          const anchor = nextIndex < c2.length ? c2[nextIndex].el : null;
          patch(null, c2[i++], el, anchor);
        }
      }
      if (i > e2) {
        while (i <= e1) {
          unmount(c1[i++]);
        }
      }
      const newKeyMap = {};
      const s1 = i;
      const s2 = i;
      for (let i2 = s2; i2 <= e2; i2++) {
        const cur = c2[i2];
        newKeyMap[cur.key] = i2;
      }
      const toBePatched = e2 - s2 + 1;
      const patchedArr = new Array(toBePatched).fill(0);
      for (let i2 = s1; i2 <= e1; i2++) {
        const newIndex = newKeyMap[c1[i2].key];
        if (newIndex === void 0) {
          unmount(c1[i2]);
        } else {
          patchedArr[newIndex - s2] = i2 + 1;
          const anchor = newIndex + 1 < c2.length ? c2[newIndex + 1] : null;
          patch(c1[i2], c2[newIndex], el, anchor);
        }
      }
      const longestPatchedArr = getSequce(patchedArr);
      let j = longestPatchedArr.length - 1;
      for (let i2 = patchedArr.length - 1; i2 >= 0; i2--) {
        const index = i2 + s2;
        const current = c2[index];
        const anchor = index + 1 < c2.length ? c2[index + 1].el : null;
        if (patchedArr[i2] === 0) {
          patch(null, c2[index], el, anchor);
        } else {
          if (i2 !== longestPatchedArr[j]) {
            hostInsert(current.el, el, anchor);
          } else {
            j--;
            console.log("\u6CA1\u52A8", current.key);
          }
        }
      }
    };
    const patchChildren = (el, n1, n2) => {
      const shapeFlag = n2.ShapeFlag;
      const preShapeFlag = n1.ShapeFlag;
      const c1 = n1.children;
      const c2 = n2.children;
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        if (preShapeFlag & 16 /* ARRAY_CHILDREN */) {
          unmountChildren(n1);
        }
        if (c1 !== c2) {
          hostSetElementText(el, c2);
        }
      } else {
        if (preShapeFlag & 16 /* ARRAY_CHILDREN */) {
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            patchKeyedChildren(el, n1, n2);
          } else {
            unmountChildren(n1);
          }
        } else {
          if (preShapeFlag & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(el, "");
          }
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(el, c2);
          }
        }
      }
    };
    const patchElement = (n1, n2) => {
      const el = n2.el = n1.el;
      patchProps(el, n1.props, n2.props);
      patchChildren(el, n1, n2);
    };
    const processElement = (n1, n2, container, anchor = null) => {
      if (!n1) {
        mountElement(n2, container, anchor);
      } else {
        patchElement(n1, n2);
      }
    };
    const processText = (n1, n2, container) => {
      if (!n1) {
        hostInsert(n2.el = hostCreateText(n2.children), container);
      } else if (n1.children !== n2.children) {
        const el = n2.el = n1.el;
        hostSetText(el, n2.children);
      }
    };
    const processFragment = (n1, n2, container) => {
      if (!n1) {
        mountChildren(container, n2.children);
      } else {
        patchChildren(n1, n2, container);
      }
    };
    const mountComponent = (vnode, container, anchor) => {
      const { data, render: render3 } = vnode.type;
      const state = reactive(data);
      const instance = {
        state,
        render: render3,
        is_mounted: false,
        vnode,
        subTree: null,
        update: null
      };
      const updateComponentFn = () => {
        if (!instance.is_mounted) {
          instance.subTree = instance.render.call(instance.state);
          patch(null, instance.subTree, container, anchor);
          instance.is_mounted = true;
        } else {
          const subTree = instance.render.call(instance.state);
          patch(instance.subTree, subTree, container, anchor);
          instance.subTree = subTree;
        }
      };
      const effect = new ReactiveEffect(updateComponentFn, () => queueJob(updateComponentFn));
      instance.update = effect.run.bind(effect);
      instance.update();
    };
    const processComponent = (n1, n2, container, anchor) => {
      if (!n1) {
        mountComponent(n2, container, anchor);
      }
    };
    const patch = (n1, n2, container, anchor = null) => {
      if (n1 && !isSameVnode(n1, n2)) {
        unmount(n1);
        n1 = null;
      }
      switch (n2.type) {
        case Text:
          processText(n1, n2, container);
          break;
        case Fragment:
          processFragment(n1, n2, container);
          break;
        default:
          if (n2.ShapeFlag & 1 /* ELEMENT */) {
            processElement(n1, n2, container, anchor);
          } else if (n2.ShapeFlag & 4 /* STATEFUL_COMPONENT */) {
            processComponent(n1, n2, container, anchor);
          }
          break;
      }
    };
    const unmount = (vnode) => {
      hostRemove(vnode.el);
    };
    const render2 = (vnode, container) => {
      if (!vnode) {
        container._vnode && unmount(container._vnode);
      } else {
        patch(container._vnode || null, vnode, container);
      }
      container._vnode = vnode;
    };
    return {
      render: render2
    };
  }

  // packages/runtime-core/src/h.ts
  function h(type, props, children) {
    return createVNode(type, props, children);
  }

  // packages/runtime-dom/src/index.ts
  var renderOptons = Object.assign(nodeOps_default, { patchProp });
  function render(vnode, container) {
    createRenderer(renderOptons).render(vnode, container);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=runtime-dom.global.js.map
