import { NodeTypes } from './ast'
import { CREATE_ELEMENT_VNODE, CREATE_TEXT, helperMap, TO_DISPLAY_STRING } from './runtimeHelpers'

function createGenerateContext() {
  const ctx = {
    code: '',
    indentLeval: 0,
    push(code) {
      // ctx.code = ctx.code + code
      this.code += code
    },
    newLine() {
      this.push(`\n` + '  '.repeat(this.indentLeval))
    },
    indent() {
      this.indentLeval++
      this.newLine()
    },
    helperMap(name) {
      return `_${helperMap[name]}`
    },
    dedent() {
      this.indentLeval--
      this.newLine()
    }
  }
  return ctx
}
function genFunctionPreale(context, ast) {
  if (ast.helpers.length) {
    context.push(`import { ${ast.helpers.map((h) => `${helperMap[h]} as _ ${helperMap[h]}`).join(', ')} } from 'vue'`)
    context.newLine()
  }
}

function genCompoundExpression(context, node) {
  const children = node.children
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (typeof child === 'string') {
      context.push(child)
    } else {
      genNode(context, child)
    }
  }
  // context.push(`${context.helperMap(node.callee)}(${node.args.join()})`)
}

function genVNodeCall(context, node) {
  context.push(`${context.helperMap(CREATE_ELEMENT_VNODE)}(`)
  genNodelist(context, [node.tag, node.props, node.children])
  context.push(')')
}

function genInterprolation(context, node) {
  context.push(`_${helperMap[TO_DISPLAY_STRING]}(`)
  genNode(context, node.content)
  // context.push(', 1 /* TEXT */)')
  context.push(')')
}

function genObjectExpression(context, node) {
  context.push('{')
  context.push(`${node.propirties.map((p) => `${p.key}: ${p.value}`).join(',')}`)
  context.push('}')
}
function genNodelistAsArray(context, nodes) {
  context.push('[')
  genNodelist(context, nodes)
  context.push(']')
}
function genNodelist(context, nodes = []) {
  for (let i = 0; i < nodes.length; i++) {
    const cur = nodes[i]
    if (typeof cur === 'string') {
      context.push(cur)
    } else if (Array.isArray(cur)) {
      genNodelistAsArray(context, cur)
    } else {
      genNode(context, cur)
    }
    if (i < nodes.length - 1) {
      context.push(',')
    }
  }
}
function genCallExpression(context, node) {
  // const { callee, arguments } = node
  const name = context.helperMap(node.callee)
  context.push(`${name}(`)

  genNodelist(context, node.arguments)

  context.push(')')
}

function genText(context, node) {
  context.push(JSON.stringify(node.content))
}

function genExpression(context, node) {
  context.push(node.content)
}

function genNode(context, node) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(context, node)
      break
    case NodeTypes.TEXT_CALL:
      genNode(context, node.codegenNode)
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(context, node)
      break
    case NodeTypes.INTERPOLATION:
      genInterprolation(context, node)
      break
    case NodeTypes.ELEMENT:
      genNode(context, node.codegenNode)
      break
    case NodeTypes.VNODE_CALL:
      genVNodeCall(context, node)
      break
    case NodeTypes.JS_OBJECT_EXPRESSION:
      genObjectExpression(context, node)
      break
    case NodeTypes.JS_CALL_EXPRESSION:
      genCallExpression(context, node)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(context, node)
      break
  }
}
export function generate(ast) {
  const context = createGenerateContext()
  genFunctionPreale(context, ast)

  const functionName = 'render'
  const args = ['_ctx']
  context.push(`function ${functionName}( ${args.join(',')} ) {`)

  context.indent()

  context.push('return ')

  if (ast.codegenNode) {
    genNode(context, ast.codegenNode)
  } else {
    return null
  }

  context.dedent()

  context.push('}')

  console.log(context.code)
}
