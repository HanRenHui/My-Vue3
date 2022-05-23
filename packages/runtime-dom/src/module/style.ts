export default function patchStyle(el, oldValue, newValue) {
    for (let key in newValue) {
        el.style[key] = newValue[key]
    }
    if (!oldValue) return;

    for (let key in oldValue) {
        if (!newValue[key]) {
            el.style[key] = null
        }
    }
    
}