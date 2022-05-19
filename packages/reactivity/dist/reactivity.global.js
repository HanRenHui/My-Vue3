var VueReactivity = (() => {
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

  // packages/reactivity/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    ReactiveEffect: () => ReactiveEffect,
    activeEffect: () => activeEffect,
    computed: () => computed,
    effect: () => effect,
    reactive: () => reactive,
    track: () => track,
    trigger: () => trigger
  });

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
      this.active = true;
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
  function cleanupEffect(effect2) {
    effect2.deps.forEach((dep) => {
      dep.delete(effect2);
    });
    effect2.deps.length = 0;
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
    if (!deps.has(activeEffect)) {
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

  // packages/reactivity/src/computed.ts
  var ComputedRefTmpl = class {
    constructor(getter) {
      this.getter = getter;
      this._dirty = true;
      this._v_isRef = true;
      this.deps = /* @__PURE__ */ new Set();
      this.effect = new ReactiveEffect(getter, () => {
        this._dirty = true;
        new Set(this.deps).forEach((dep) => {
          if (dep.scheduler) {
            dep.scheduler();
          } else {
            dep.run();
          }
        });
      });
    }
    get value() {
      if (this._dirty) {
        this._value = this.effect.run();
        this._dirty = false;
      }
      const shouldTrack = !this.deps.has(activeEffect);
      if (shouldTrack) {
        this.deps.add(activeEffect);
        activeEffect.deps.push(this.deps);
      }
      return this._value;
    }
  };
  function computed(getter) {
    return new ComputedRefTmpl(getter);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.global.js.map
