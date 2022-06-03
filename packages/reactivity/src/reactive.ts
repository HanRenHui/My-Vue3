import { activeEffect } from "./effect";

const cache = new WeakMap()
export function reactive(target: Record<string, any>) {
    if (cache.get(target)) return cache.get(target)

    if (target.is_reactive) {
        // 检测传进来的是不是代理对象
        return target
    }

    const proxy = new Proxy(target, {
        get(target, key, recevier) {
            if (key === 'is_reactive') {
                return true;
            }
            track(target, key)
            return Reflect.get(target, key, recevier)
        },
        set(target, key, value, recevier) {
            let rs = Reflect.set(target, key, value, recevier)
            trigger(target, key) // ? trigger的顺序
            return rs;

        }
    })

    cache.set(target, proxy)

    return proxy;
}

const map = new WeakMap()
export function track(target: Record<string, any>, key: string | symbol) {
    let depMap = map.get(target)
    if (!depMap) {
        map.set(target, depMap = new Map())
    }

    let deps = depMap.get(key)
    if (!deps) {
        depMap.set(key, deps = new Set())
    }
    if (!deps.has(activeEffect) && activeEffect) {
        deps.add(activeEffect)
    }
    activeEffect && activeEffect.deps.push(deps)

}


export function trigger(target: Record<string, any>, key: string | symbol) {
    debugger
    const depMap = map.get(target)
    if (!depMap) return
    const deps = depMap.get(key)
    if (!deps) return
    new Set(deps).forEach((effect: any) => {
        if (effect !== activeEffect) {
            console.log(22222)
            if (effect.scheduler) {
                effect.scheduler()
            } else {
                effect.run()            
            }
        }
    })

}