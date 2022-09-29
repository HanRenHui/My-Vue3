import { NodeTypes } from './ast'
// there still has some problems

function advancePositionWithMutation(context, endIndex) {
  // line column offset
  let linsCount = 0 // 回车数
  let linePos = -1
  for (let i = 0; i < endIndex; i++) {
    if (context.source.charCodeAt(i) == 10) {
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
  advancePositionWithMutation(context, endIndex)

  context.souce = context.source.slice(endIndex)
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

function parseChildren(context: Record<string, any>, template) {
  let nodes = []
  let node = null
  while (context.source) {
    if (context.source.startsWith('<')) {
      // 标签
      break
    } else if (context.source.startsWith('{{')) {
      // 插值
      break
    } else {
      // 文本
      node = parseText(context)
    }
    nodes.push(node)
  }

  return nodes
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

export function parse(template: string) {
  const context = createContext(template)
  const nodes = parseChildren(context, template)
  console.log(4444, nodes)
}
