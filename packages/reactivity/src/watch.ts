import { ReactiveEffect } from "./effect"

function traverse(obj: Record<string, any>) {
    if (typeof obj !== 'object') return obj

    for (let k  in obj) {
        traverse(obj[k])
    }
    return obj
}

export function watch(source: any, cb: (newv: any, oldv: any, onCleanup: (...args: any[]) => any) => any) {
    let getter = null
    if (typeof source !== 'function') {
        getter = () => traverse(source)
    } else {
        getter= source
    }
    let clean: any
    const onCleanup = (fn: any) => {
        clean = fn
    }
    let oldValue: any
    const cbWrap = () => {
        const newValue = effect.run()
        clean&&clean()
        cb(newValue, oldValue, onCleanup)
        oldValue = newValue;
    }
    const effect = new ReactiveEffect(getter, cbWrap)
    oldValue = effect.run()
    
}