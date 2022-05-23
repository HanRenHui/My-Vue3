import patchClass from './module/class'
import patchStyle from './module/style'
import patchEvent from './module/event'
import patchAttr from './module/attr'
export function patchProp(el, key, preValue, nextValue) {
    if (key === 'class') {
        patchClass(el, nextValue)
    } else if (key === 'style') {
        patchStyle(el, preValue, nextValue)
    } else if (/^on[^a-z][a-z]+/.test(key)) {
        patchEvent(el, key, nextValue)
    } else {
        patchAttr(el, key, nextValue)
    }
}