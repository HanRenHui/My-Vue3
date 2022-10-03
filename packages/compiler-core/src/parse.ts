import { NodeTypes } from './ast'
// there still has some problems

function advancePositionWithMutation(context, source, endIndex) {
  // line column offset
  let linsCount = 0 // 回车数
  let linePos = -1
  for (let i = 0; i < endIndex; i++) {
    if (source.charCodeAt(i) == 10) {
      // 换行或者回车
      linsCount++
      linePos = i
    }
  }

  context.line += linsCount
  if (linePos === -1) {
    context.column += endIndex
  } else {
    context.column = endIndex - linePos
  }

  context.offset += endIndex
}

function advanceBy(context, endIndex) {
  advancePositionWithMutation(context, context.source, endIndex)

  context.source = context.source.slice(endIndex)
}

function parseTextData(context, endIndex) {
  const rawText = context.source.slice(0, endIndex)
  advanceBy(context, endIndex)
  return rawText
}

function getCursor(context) {
  const { line, column, offset } = context
  return {
    line,
    column,
    offset
  }
}

function getSelection(context, start, end?) {
  end = end || getCursor(context)
  return {
    start,
    end,
    source: context.originSource.slice(start.offset, end.offset)
  }
}

function parseText(context) {
  const endTokens = ['{{', '<']
  let lastIndex = context.source.length
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    if (index !== -1 && lastIndex > index) {
      lastIndex = index
    }
  }

  const start = getCursor(context)

  const content = parseTextData(context, lastIndex)

  return {
    type: NodeTypes.TEXT,
    loc: getSelection(context, start),
    content
  }
}

function parseInterception(context) {
  const outerStart = getCursor(context)
  const closeIndex = context.source.indexOf('}}')

  advanceBy(context, 2)

  const innerStart = getCursor(context)
  const innerEnd = getCursor(context)

  const originContent = parseTextData(context, closeIndex - 2)
  const content = originContent.trim()

  const startOffset = originContent.indexOf(content)
  if (startOffset) {
    advancePositionWithMutation(innerStart, originContent, startOffset)
  }

  const endOffset = startOffset + content.length

  advancePositionWithMutation(innerEnd, originContent, endOffset)

  advanceBy(context, 2)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      loc: getSelection(context, innerStart, innerEnd)
    },
    loc: getSelection(context, outerStart)
  }
}
function advanceBySpaces(context) {
  const reg = /^[ \r\n\t]*/
  const match = reg.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}

function parseAttributeValue(context) {
  const start = getCursor(context)

  const quote = context.source[0]

  let content = ''
  if (quote === '"' || quote === "'") {
    advanceBy(context, 1)
    const closeIndex = context.source.indexOf(quote)
    content = parseTextData(context, closeIndex)
    advanceBy(context, 1)
  }
  return {
    content,
    loc: getSelection(context, start),
    type: NodeTypes.TEXT
  }
}

function parseAttribute(context) {
  const start = getCursor(context)
  const match = /^[^\r\n\t\f=]+/.exec(context.source)
  const name = match[0]
  advanceBy(context, name.length)
  advanceBySpaces(context)
  advanceBy(context, 1)
  advanceBySpaces(context)
  const value = parseAttributeValue(context)
  return {
    loc: getSelection(context, start),
    name,
    value,
    type: NodeTypes.ATTRIBUTE
  }
}
function parseAttributes(context) {
  const props = []
  while (context.source && !context.source.startsWith('>')) {
    // a = "123"
    const prop = parseAttribute(context)
    props.push(prop)
    advanceBySpaces(context)
  }

  return props
}

function parseTag(context) {
  const start = getCursor(context)
  // const reg = /^<\/?[a-z][^\t\r\n]*/
  const reg = /^<\/?([a-z][^ \t\r\n/>]*)/
  const match = reg.exec(context.source)
  const tag = match[1]
  advanceBy(context, match[0].length)
  advanceBySpaces(context)
  // const tag = match[0]
  const isSelfClosing = context.source.startsWith('</')
  const props = parseAttributes(context)

  advanceBy(context, isSelfClosing ? 2 : 1)

  return {
    type: NodeTypes.ELEMENT,
    isSelfClosing,
    tag,
    props,
    children: [],
    loc: getSelection(context, start)
  }
}

function parseElement(context) {
  const ele = parseTag(context)
  const nodes = parseChildren(context)
  if (context.source.startsWith('</')) {
    parseTag(context)
  }
  ele.children = nodes
  return ele
}

function parseChildren(context: Record<string, any>) {
  const nodes = []
  let node = null
  while (context.source && !context.source.startsWith('</')) {
    if (context.source.startsWith('<')) {
      // 标签
      node = parseElement(context)
      // break
    } else if (context.source.startsWith('{{')) {
      // 插值
      node = parseInterception(context)
    } else {
      // 文本
      node = parseText(context)
    }
    nodes.push(node)
  }
  // 去除空白字符的node节点
  nodes.forEach((node, i) => {
    if (node.type === NodeTypes.TEXT && /^[\r\n\t\f ]*$/.exec(node.content)) {
      nodes[i] = null
    }
  })
  return nodes.filter(Boolean)
}

function createContext(source: string) {
  return {
    originSource: source,
    source,
    line: 1,
    column: 1,
    offset: 0
  }
}

function createRootNode(children, loc) {
  return {
    type: NodeTypes.ROOT,
    loc,
    children
  }
}

export function parse(template: string) {
  const context = createContext(template)
  const start = getCursor(context)
  const nodes = parseChildren(context)
  const RootNode = createRootNode(nodes, getSelection(context, start))
  return RootNode
}
