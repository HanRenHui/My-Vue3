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
    LifecycleHooks: () => LifecycleHooks,
    ReactiveEffect: () => ReactiveEffect,
    Text: () => Text,
    activeEffect: () => activeEffect,
    createComponentInstance: () => createComponentInstance,
    createElementBlock: () => createElementBlock,
    createElementVNode: () => createVNode,
    createRenderer: () => createRenderer,
    createVNode: () => createVNode,
    currentInstance: () => currentInstance,
    effect: () => effect,
    getCurrentInstance: () => getCurrentInstance,
    h: () => h,
    hasPropChanged: () => hasPropChanged,
    inject: () => inject,
    isSameVnode: () => isSameVnode,
    isVnode: () => isVnode,
    onBeforeMount: () => onBeforeMount,
    onBeforeUpdate: () => onBeforeUpdate,
    onMounted: () => onMounted,
    onUpdated: () => onUpdated,
    openBlock: () => openBlock,
    patchProp: () => patchProp,
    provide: () => provide,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    ref: () => ref,
    render: () => render,
    setCurrentInstance: () => setCurrentInstance,
    setupComponent: () => setupComponent,
    toDisplayString: () => toDisplayString,
    track: () => track,
    trigger: () => trigger,
    updateProps: () => updateProps,
    watch: () => watch
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
  function cleanupEffect(effect3) {
    effect3.deps.forEach((dep) => {
      dep.delete(effect3);
    });
    effect3.deps.length = 0;
  }
  function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
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
    new Set(deps).forEach((effect3) => {
      if (effect3 !== activeEffect) {
        if (effect3.scheduler) {
          effect3.scheduler();
        } else {
          effect3.run();
        }
      }
    });
  }

  // packages/reactivity/src/watch.ts
  function traverse(obj) {
    if (typeof obj !== "object")
      return obj;
    for (let k in obj) {
      traverse(obj[k]);
    }
    return obj;
  }
  function watch(source, cb) {
    let getter = null;
    if (typeof source !== "function") {
      getter = () => traverse(source);
    } else {
      getter = source;
    }
    let clean;
    const onCleanup = (fn) => {
      clean = fn;
    };
    let oldValue;
    const cbWrap = () => {
      const newValue = effect3.run();
      clean && clean();
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    };
    const effect3 = new ReactiveEffect(getter, cbWrap);
    oldValue = effect3.run();
  }

  // packages/reactivity/src/ref.ts
  function toReactive(value) {
    return typeof value === "object" ? reactive(value) : value;
  }
  var RefImpl = class {
    constructor(rawValue) {
      this.rawValue = rawValue;
      this.deps = /* @__PURE__ */ new Set();
      this.__v_isRef = true;
      this._value = toReactive(rawValue);
    }
    get value() {
      if (activeEffect) {
        const shouldTrack = !this.deps.has(activeEffect);
        if (shouldTrack) {
          this.deps.add(activeEffect);
          activeEffect.deps.push(this.deps);
        }
      }
      return this._value;
    }
    set value(newValue) {
      if (newValue === this.rawValue)
        return;
      this.rawValue = newValue;
      this._value = toReactive(newValue);
      new Set(this.deps).forEach((dep) => {
        if (dep.scheduler) {
          dep.scheduler();
        } else {
          dep.run();
        }
      });
    }
  };
  function ref(target) {
    return new RefImpl(target);
  }
  function proxyRefs(object) {
    return new Proxy(object, {
      get(target, key, recevier) {
        let r = Reflect.get(target, key, recevier);
        return r.__v_isRef ? r.value : r;
      },
      set(target, key, value, recevier) {
        let oldValue = target[key];
        if (oldValue.__v_isRef) {
          oldValue.value = value;
          return true;
        } else {
          return Reflect.set(target, key, value, recevier);
        }
      }
    });
  }

  // packages/shared/src/index.ts
  function isObject(obj) {
    return typeof obj === "object" && obj !== null;
  }
  function isArray(obj) {
    return Array.isArray(obj);
  }
  function invokeFns(fns) {
    if (!fns || !Array.isArray(fns))
      return;
    fns.forEach((fn) => fn());
  }

  // packages/runtime-core/src/component.ts
  var currentInstance = null;
  function setCurrentInstance(instance) {
    currentInstance = instance;
  }
  function getCurrentInstance() {
    return currentInstance;
  }
  var initProps = (instance, rawProps) => {
    const props = {};
    const attrs = {};
    const propOptions = instance.propOptions || {};
    for (const key in rawProps) {
      const v = rawProps[key];
      if (key in propOptions) {
        props[key] = v;
      } else {
        attrs[key] = v;
      }
    }
    instance.props = reactive(props);
    instance.attrs = attrs;
  };
  function createComponentInstance(vnode, parent) {
    console.log(33333, parent);
    const { render: render2, props: propOptions } = vnode.type;
    const instance = {
      data: null,
      render: render2,
      is_mounted: false,
      vnode,
      subTree: null,
      update: null,
      propOptions,
      attrs: {},
      props: {},
      proxy: null,
      setupState: {},
      parent,
      provides: parent ? parent.provides : {}
    };
    return instance;
  }
  var publicProperty = {
    $attrs: (i) => i.attrs,
    $slots: (i) => i.slots
  };
  function initSlots(instance, children) {
    if (instance.vnode.ShapeFlag & 32 /* SLOTS_CHILDREN */) {
      instance.slots = children;
    }
  }
  function setupComponent(instance) {
    const { props, children } = instance.vnode;
    initProps(instance, props);
    initSlots(instance, children);
    instance.proxy = new Proxy(instance, {
      get(target, key) {
        if (key in target.data) {
          return target.data[key];
        } else if (key in target.setupState) {
          return target.setupState[key];
        } else if (key in target.props) {
          return target.props[key];
        } else {
          const getter = publicProperty[key];
          if (getter) {
            console.log(target);
            return getter(target);
          }
        }
      },
      set(target, key, value) {
        if (key in target.data) {
          target.data[key] = value;
          return true;
        } else if (key in target.setupState) {
          target.setupState[key] = value;
          return true;
        } else if (key in target.props) {
          console.warn("no set props");
          return false;
        }
        return false;
      }
    });
    const data = instance.vnode.type.data;
    if (data) {
      instance.data = reactive(data.call(instance.proxy));
    } else {
      instance.data = {};
    }
    const setup = instance.vnode.type.setup;
    if (setup) {
      const setupContext = {
        attrs: instance.attrs,
        slots: instance.slots,
        emit(eventName, ...args) {
          const props2 = instance.vnode.props;
          const targetEventName = `on${eventName[0].toUpperCase()}${eventName.slice(1)}`;
          const cb = props2[targetEventName];
          cb && cb(...args);
        }
      };
      setCurrentInstance(instance);
      const setupResult = setup(instance.props, setupContext);
      setCurrentInstance(null);
      if (typeof setupResult === "function") {
        instance.render = setupResult;
      } else {
        instance.setupState = proxyRefs(setupResult);
      }
    }
  }
  function hasPropChanged(preProps, nextProps) {
    const prePropKeys = Object.keys(preProps);
    const nextPropKeys = Object.keys(nextProps);
    if (prePropKeys.length !== nextPropKeys.length)
      return true;
    for (let i = 0; i < nextPropKeys.length; i++) {
      const key = nextPropKeys[i];
      if (nextProps[key] !== preProps[key])
        return true;
    }
    return false;
  }
  function updateProps(preProps = {}, nextProps) {
    for (const key in nextProps) {
      if (nextProps[key] !== preProps[key]) {
        preProps[key] = nextProps[key];
      }
    }
    for (const key in preProps) {
      if (!(key in nextProps)) {
        delete preProps[key];
      }
    }
  }

  // packages/runtime-core/src/apiLifecycle.ts
  var LifecycleHooks = /* @__PURE__ */ ((LifecycleHooks2) => {
    LifecycleHooks2["BEFORE_MOUNT"] = "BEFORE_MOUNT";
    LifecycleHooks2["MOUNTED"] = "MOUNTED";
    LifecycleHooks2["BEFORE_UPDAT"] = "BEFORE_UPDAT";
    LifecycleHooks2["UPDATED"] = "UPDATED";
    return LifecycleHooks2;
  })(LifecycleHooks || {});
  function createHook(type) {
    return function(hook, target = currentInstance) {
      const hooks = target[type] || (target[type] = []);
      const wrappedHook = () => {
        setCurrentInstance(target);
        hook();
        setCurrentInstance(null);
      };
      hooks.push(wrappedHook);
    };
  }
  var onBeforeUpdate = createHook("BEFORE_UPDAT" /* BEFORE_UPDAT */);
  var onUpdated = createHook("UPDATED" /* UPDATED */);
  var onBeforeMount = createHook("BEFORE_MOUNT" /* BEFORE_MOUNT */);
  var onMounted = createHook("MOUNTED" /* MOUNTED */);

  // packages/runtime-core/src/queue.ts
  var queue = [];
  var flushing = false;
  var p = Promise.resolve();
  function queueJob(job) {
    if (!queue.includes(job)) {
      queue.push(job);
    }
    if (!flushing) {
      flushing = true;
      p.then(() => {
        let copy = queue.slice(0);
        flushing = false;
        queue.length = 0;
        copy.forEach((c) => c());
        copy.length = 0;
      });
    }
  }

  // packages/runtime-core/src/vnode.ts
  function createVNode(type, props = {}, children = [], patchFlag) {
    const ShapeFlag = 0;
    const vnode = {
      __v_isVnode: true,
      type,
      props,
      ShapeFlag,
      children,
      key: props == null ? void 0 : props.key,
      patchFlag
    };
    if (props == null ? void 0 : props.key) {
      delete props.key;
    }
    if (typeof type === "string") {
      vnode.ShapeFlag = 1 /* ELEMENT */;
    } else if (typeof type === "object") {
      vnode.ShapeFlag = 4 /* STATEFUL_COMPONENT */;
    }
    if (children !== void 0) {
      let type2 = 0;
      if (Array.isArray(children)) {
        type2 = 16 /* ARRAY_CHILDREN */;
      } else if (isObject(children)) {
        type2 = 32 /* SLOTS_CHILDREN */;
      } else {
        type2 = 8 /* TEXT_CHILDREN */;
      }
      vnode.ShapeFlag |= type2;
    }
    if (currentBlock && patchFlag) {
      currentBlock.push(vnode);
    }
    return vnode;
  }
  var isVnode = (vnode) => vnode.__v_isVnode;
  function isSameVnode(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }
  var currentBlock = null;
  function openBlock() {
    currentBlock = [];
  }
  function setupBlock(vnode) {
    vnode.dynamicChildren = currentBlock;
    currentBlock = null;
    return vnode;
  }
  function createElementBlock(type, props, children, patchFlag) {
    const vnode = createVNode(type, props, children, patchFlag);
    setupBlock(vnode);
    return vnode;
  }
  function toDisplayString(val) {
    if (typeof val === "string")
      return val;
    return JSON.stringify(val);
  }

  // packages/runtime-core/src/renderer.ts
  var Text = Symbol.for("Text");
  var Fragment = Symbol.for("Fragment");
  function createRenderer(renderOptions) {
    const {
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
    const mountChildren = (container, children, parent) => {
      children.forEach((child, i) => {
        patch(null, child, container, null, parent);
      });
    };
    const mountElement = (vnode, container, anchor = null, parent) => {
      vnode.el = hostCreateElement(vnode.type);
      for (const key in vnode.props) {
        hostPatchProp(vnode.el, key, null, vnode.props[key]);
      }
      if (vnode.ShapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(vnode.el, vnode.children, parent);
      } else if (vnode.ShapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(vnode.el, vnode.children);
      }
      hostInsert(vnode.el, container, anchor);
    };
    const patchProps = (el, preProps, nextProps) => {
      for (const key in nextProps) {
        hostPatchProp(el, key, preProps[key], nextProps[key]);
      }
      for (const key in preProps) {
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
        const lastIndex = rs[rs.length - 1];
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
    const patchKeyedChildren = (el, n1, n2, parent) => {
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
          patch(null, c2[i++], el, anchor, parent);
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
          patch(c1[i2], c2[newIndex], el, anchor, parent);
        }
      }
      const longestPatchedArr = getSequce(patchedArr);
      let j = longestPatchedArr.length - 1;
      for (let i2 = patchedArr.length - 1; i2 >= 0; i2--) {
        const index = i2 + s2;
        const current = c2[index];
        const anchor = index + 1 < c2.length ? c2[index + 1].el : null;
        if (patchedArr[i2] === 0) {
          patch(null, c2[index], el, anchor, parent);
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
    const patchChildren = (el, n1, n2, parent) => {
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
            patchKeyedChildren(el, n1, n2, parent);
          } else {
            unmountChildren(n1);
          }
        } else {
          if (preShapeFlag & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(el, "");
          }
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(el, c2, parent);
          }
        }
      }
    };
    const patchBlockChildren = (n1, n2, parent) => {
      for (let i = 0; i < n2.dynamicChildren.length; i++) {
        patchElement(n1.dynamicChildren[i], n2.dynamicChildren[i], parent);
      }
    };
    const patchElement = (n1, n2, parent) => {
      const el = n2.el = n1.el;
      const oldProps = n1.props || {};
      const newProps = n2.props || {};
      const { patchFlag } = n2;
      if (patchFlag & 2 /* CLASS */) {
        if (oldProps.class !== newProps.class) {
          hostPatchProp(el, "class", oldProps.class, newProps.class);
        }
      } else if (patchFlag & 4 /* STYLE */) {
        if (oldProps.style !== newProps.style) {
          hostPatchProp(el, "style", oldProps.style, newProps.style);
        }
      } else {
        patchProps(el, n1.props, n2.props);
      }
      if (n2.dynamicChildren) {
        patchBlockChildren(n1, n2, parent);
      } else {
        patchChildren(el, n1, n2, parent);
      }
    };
    const processElement = (n1, n2, container, anchor = null, parent) => {
      if (!n1) {
        mountElement(n2, container, anchor, parent);
      } else {
        patchElement(n1, n2, parent);
      }
    };
    const processtext = (n1, n2, container) => {
      if (!n1) {
        hostInsert(n2.el = hostCreateText(n2.children), container);
      } else if (n1.children !== n2.children) {
        const el = n2.el = n1.el;
        hostSetText(el, n2.children);
      }
    };
    const processFragment = (n1, n2, container, parent) => {
      if (!n1) {
        mountChildren(container, n2.children, parent);
      } else {
        patchChildren(container, n1, n2, parent);
      }
    };
    const updateComponentPreRender = (instance, nextVNode) => {
      instance.next = null;
      updateProps(instance.props, nextVNode.props);
    };
    const setupRenderEffect = (instance, container, anchor) => {
      const updateComponentFn = () => {
        if (!instance.is_mounted) {
          invokeFns(instance["BEFORE_MOUNT" /* BEFORE_MOUNT */]);
          instance.subTree = instance.render.call(instance.proxy);
          patch(null, instance.subTree, container, anchor, instance);
          invokeFns(instance["MOUNTED" /* MOUNTED */]);
          instance.is_mounted = true;
        } else {
          if (instance.next) {
            const next = instance.next;
            updateComponentPreRender(instance, next);
          }
          const subTree = instance.render.call(instance.proxy);
          invokeFns(instance["BEFORE_UPDAT" /* BEFORE_UPDAT */]);
          patch(instance.subTree, subTree, container, anchor);
          invokeFns(instance["UPDATED" /* UPDATED */]);
          instance.subTree = subTree;
        }
      };
      const effect3 = new ReactiveEffect(updateComponentFn, () => queueJob(updateComponentFn));
      instance.update = effect3.run.bind(effect3);
      instance.update();
    };
    const mountComponent = (vnode, container, anchor, parent) => {
      const instance = vnode.component = createComponentInstance(vnode, parent);
      setupComponent(instance);
      setupRenderEffect(instance, container, anchor);
    };
    const shouldUpdateComponent = (n1, n2) => {
      return hasPropChanged(n1.props, n2.props);
    };
    const updateComponent = (n1, n2) => {
      const instance = n2.component = n1.component;
      if (shouldUpdateComponent(n1, n2)) {
        instance.next = n2;
        instance.update();
      }
    };
    const processComponent = (n1, n2, container, anchor, parent) => {
      if (!n1) {
        mountComponent(n2, container, anchor, parent);
      } else {
        updateComponent(n1, n2);
      }
    };
    const patch = (n1, n2, container, anchor = null, parent) => {
      if (n1 && !isSameVnode(n1, n2)) {
        unmount(n1);
        n1 = null;
      }
      switch (n2.type) {
        case Text:
          processtext(n1, n2, container);
          break;
        case Fragment:
          processFragment(n1, n2, container, parent);
          break;
        default:
          if (n2.ShapeFlag & 1 /* ELEMENT */) {
            processElement(n1, n2, container, anchor, parent);
          } else if (n2.ShapeFlag & 4 /* STATEFUL_COMPONENT */) {
            processComponent(n1, n2, container, anchor, parent);
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
    const l = arguments.length;
    if (l === 2) {
      if (isObject(props)) {
        if (!isArray(props)) {
          if (isVnode(props)) {
            return createVNode(type, null, [props]);
          } else {
            return createVNode(type, props);
          }
        } else {
          return createVNode(type, null, props);
        }
      } else {
        return createVNode(type, null, props);
      }
    } else {
      if (l > 3) {
        children = Array.from(arguments).slice(2);
      } else if (l === 3 && isVnode(children)) {
        children = [children];
      }
      return createVNode(type, props, children);
    }
  }

  // packages/runtime-core/src/apiInject.ts
  function provide(key, value) {
    const currentInstance2 = getCurrentInstance();
    if (!currentInstance2) {
      return;
    }
    const parentProvides = currentInstance2.parent && currentInstance2.parent.provides;
    if (currentInstance2.provides === parentProvides) {
      currentInstance2.provides = Object.create(parentProvides);
    }
    currentInstance2.provides[key] = value;
  }
  function inject(key, defaultValue) {
    const currentInstance2 = getCurrentInstance();
    if (!currentInstance2) {
      return;
    }
    const parentProvides = currentInstance2.parent && currentInstance2.parent.provides;
    if (key && key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      return defaultValue;
    }
  }

  // packages/runtime-dom/src/index.ts
  var renderOptons = Object.assign(nodeOps_default, { patchProp });
  function render(vnode, container) {
    createRenderer(renderOptons).render(vnode, container);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=runtime-dom.global.js.map
