export default {
  // 增删改查
  insert(child, parent, anchor = null) {
    parent.insertBefore(child, anchor)
  },

  createElement(tagName) {
    return document.createElement(tagName)
  },

  createText(text) {
    return document.createTextNode(text)
  },

  remove(child) {
    const parentNode = child.parentNode
    if (parentNode) {
      parentNode.removeChild(child)
    }
  },

  setElementText(el, text) {
    el.textContent = text
  },

  // 文本节点 document.createTextNode()
  setText(node, text) {
    node.nodeValue = text
  },

  querySelector(selector) {
    return document.querySelector(selector)
  },

  parentNode(node) {
    return node.parentNode
  },

  nextSibling(node) {
    return node.nextSibling
  }
}
