export default function attr(el, key, nextValue) {
    if (!nextValue) {
        el.removeAttribute(key)
    } else {
        el.setAttribute(el, key, nextValue)
    }
}