export default function patchClass(el, newValue) {
    if (!newValue) return el.removeAttribute('class')
    el.className = newValue
}