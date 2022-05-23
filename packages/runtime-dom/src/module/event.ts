function createInvoker(callback) {
    const invoker = (e) => invoker.value(e)

    invoker.value = callback

    return invoker
}

export default function patchEvent(el, eventName, callback) {
    const _store = el._store || (el._store = {})
    let exsit = _store[eventName]
    const event = eventName.slice(2).toLowerCase()
    if (exsit) {
        exsit.value = callback
        if (!callback) {
            window.removeEventListener(event, exsit)
            _store[eventName] = undefined
        }
    } else {
        const invoker = _store[eventName] = createInvoker(callback)
        window.addEventListener(event, invoker)
    }
}