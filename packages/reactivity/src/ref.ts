import { activeEffect } from "./effect";
import { reactive } from "./reactive";

function toReactive(value: any) {
    return typeof value === 'object' ? reactive(value) : value
}

class RefImpl {
    public _value;
    public deps = new Set();
    public __v_isRef = true;
    constructor(public rawValue: any) {
        this._value = toReactive(rawValue)
    }

    get value() {
        const shouldTrack = !this.deps.has(activeEffect)
        if (shouldTrack) {
            this.deps.add(activeEffect)
            activeEffect.deps.push(this.deps)
        }
        return this._value
    }

    set(newValue: any) {
        if (newValue === this.rawValue) return
        this.rawValue = newValue
        this._value = toReactive(newValue)
        new Set(this.deps).forEach((dep: any) => {
            if (dep.scheduler) {
                dep.scheduler()
            } else {
                dep.run()            
            }
        })
    }
}


export function ref(target: any) {
    return new RefImpl(target)
}
