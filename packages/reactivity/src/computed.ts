import { activeEffect, ReactiveEffect } from "./effect"
import { track, trigger } from './reactive'

class ComputedRefTmpl {
    private _value: any
    private effect: ReactiveEffect
    private _dirty = true
    private _v_isRef = true
    private deps: Set<ReactiveEffect>  = new Set()
    constructor(public getter: () => void) {
        this.effect = new ReactiveEffect(getter, () => {
            this._dirty = true
            // trigger(this, 'value')
            new Set(this.deps).forEach((dep: any) => {
                if (dep.scheduler) {
                    dep.scheduler()
                } else {
                    dep.run()            
                }
            })
        })
    }

    get value() {
        if (this._dirty) {
            this._value = this.effect.run()
            this._dirty = false
        }
        // 可以这么写 但没必要
        // track(this, 'value')
        // 可以抽成
        const shouldTrack = !this.deps.has(activeEffect)
        if (shouldTrack) {
            this.deps.add(activeEffect)
            activeEffect.deps.push(this.deps)
        }

        return this._value
    }
}

export function computed(getter: () => void) {
    return new ComputedRefTmpl(getter)
}