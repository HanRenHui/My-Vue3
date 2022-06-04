import { currentInstance, setCurrentInstance } from './component'
export const enum LifecycleHooks {
    BEFORE_MOUNT = 'BEFORE_MOUNT',
    MOUNTED = 'MOUNTED',
    BEFORE_UPDAT = 'BEFORE_UPDAT',
    UPDATED = 'UPDATED' 
}

function createHook(type) {
    return function(hook, target = currentInstance) {
        const hooks = target[type] || (target[type] = [])
        const wrappedHook = () => {
            setCurrentInstance(target)
            hook()
        }
        hooks.push(wrappedHook)
    }
}


export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDAT)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)