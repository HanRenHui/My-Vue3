export const TO_DISPLAY_STRING = Symbol.for('toDisplayString')
export const CREATE_TEXT = Symbol.for('createTextVnode')
export const CREATE_ELEMENT_VNODE = Symbol.for('createElementVNode')
export const CREATE_BLOCK_VNODE = Symbol.for('createBlockVNode')
export const OPEN_BLOCK = Symbol.for('openBlock')
export const FRAGEMENT = Symbol.for('fragment')
export const helperMap = {
  [TO_DISPLAY_STRING]: 'toDisplayString',
  [CREATE_TEXT]: 'createTextVnode',
  [CREATE_ELEMENT_VNODE]: 'createElementVNode',
  [CREATE_BLOCK_VNODE]: 'createBlockVNode',
  [OPEN_BLOCK]: 'openBlock',
  [FRAGEMENT]: 'fragement'
}
