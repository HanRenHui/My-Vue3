export let activeEffect: ReactiveEffect

export class ReactiveEffect {
    parent: ReactiveEffect | undefined = undefined
    active = true
    deps: any = [] //? 类型问题
    constructor(public fn: Function, public scheduler: () => void) {}

    run() {
        if (!this.active) return this.fn()
        this.active = true; // ?
        this.parent = activeEffect
        activeEffect = this
        // 分之切换
        cleanupEffect(this)
        const v = this.fn()
        activeEffect = this.parent
        return v;
    }

    stop() {
        this.active = false;
        cleanupEffect(this)   
    }
}

function cleanupEffect(effect: ReactiveEffect) {
    effect.deps.forEach((dep: Set<ReactiveEffect>) => {
        dep.delete(effect)
    })
    effect.deps.length = 0
}


export function effect(fn: Function, options: Record<string, any> = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler)   
    _effect.run()
    const runner: any = _effect.run.bind(_effect)
    runner.effect = _effect
    return runner
}