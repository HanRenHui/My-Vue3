import { CREATE_TEXT } from './runtimeHelpers'

export const enum NodeTypes {
  ROOT, // 根节点
  ELEMENT, // 元素
  TEXT, // 文本
  COMMENT, // 注释
  SIMPLE_EXPRESSION, // 简单表达式  aaa   :a="aa"
  INTERPOLATION, // 模板表达式  {{aaa}}
  ATTRIBUTE,
  DIRECTIVE,
  // containers
  COMPOUND_EXPRESSION, // 复合表达式  {{aa}} abc
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL, // 文本调用 需要单独给文本调用createTextContent 如果是TEXT的话 直接接innerText就好了
  // codegen
  VNODE_CALL, // 元素调用
  JS_CALL_EXPRESSION, // js调用表达式
  JS_OBJECT_EXPRESSION
}

// type可以是NodeTypes.TEXT  NodeTypes.INTERPOLATION COMPOUND_EXPRESSION
// 假如需要调用createTextVNode(文本节点有兄弟节点)的话 会变成 NodeTypes.TEXT_CALL

// 各种ast的数据格式
// root
// {
//     type: NodeTypes.ROOT,
//     loc,
//     children
// }

// Element
//     type: NodeTypes.ELEMENT,
//     isSelfClosing,
//     tag,
//     props: ATTREBUTE[], // attribute节点的数组
//     children: [],
//     loc: getSelection(context, start)

// ATTRIBUTE 属性
// loc: getSelection(context, start),
// name,
// value: attributeValue节点,
// type: NodeTypes.ATTRIBUTE

// attributeValue
// content,
// loc: getSelection(context, start),
// type: NodeTypes.TEXT

// 表达式
// return {
//     type: NodeTypes.INTERPOLATION,
//     content: {
//       type: NodeTypes.SIMPLE_EXPRESSION,
//       content,
//       loc: getSelection(context, innerStart, innerEnd)
//     },
//     loc: getSelection(context, outerStart)
//   }

// 纯文本
// type: NodeTypes.TEXT,
// loc: getSelection(context, start),
// content

// 需要调用createTextNode创建的文本节点
// type: NodeTypes.TEXT_CALL
// context: Text的node节点的内容

export function createCallExpression(context, args) {
  const callee = context.helper(CREATE_TEXT)
  return {
    callee,
    arguments: args,
    type: NodeTypes.JS_CALL_EXPRESSION
  }
}
export function createObjectExpression(propirties) {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    propirties
  }
}
export function createVnodeCall(context, tag, propirties, children) {
  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    propirties,
    children
  }
}
