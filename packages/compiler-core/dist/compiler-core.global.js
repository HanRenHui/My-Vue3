var VueCompilerCore = (() => {
  var __defProp = Object.defineProperty
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor
  var __getOwnPropNames = Object.getOwnPropertyNames
  var __hasOwnProp = Object.prototype.hasOwnProperty
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true })
  }
  var __copyProps = (to, from, except, desc) => {
    if ((from && typeof from === 'object') || typeof from === 'function') {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, {
            get: () => from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
          })
    }
    return to
  }
  var __toCommonJS = (mod) =>
    __copyProps(__defProp({}, '__esModule', { value: true }), mod)

  // packages/compiler-core/src/index.ts
  var src_exports = {}
  __export(src_exports, {
    compile: () => compile
  })

  // packages/compiler-core/src/parse.ts
  function advancePositionWithMutation(context, endIndex) {
    let linsCount = 0
    let linePos = -1
    for (let i = 0; i < endIndex; i++) {
      if (context.source.charCodeAt(i) == 10) {
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
  function getSelection(context, start, end) {
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
      type: 2 /* TEXT */,
      loc: getSelection(context, start),
      content
    }
  }
  function parseChildren(context, template) {
    let nodes = []
    let node = null
    while (context.source) {
      if (context.source.startsWith('<')) {
        break
      } else if (context.source.startsWith('{{')) {
        break
      } else {
        node = parseText(context)
      }
      nodes.push(node)
    }
    return nodes
  }
  function createContext(source) {
    return {
      originSource: source,
      source,
      line: 1,
      column: 1,
      offset: 0
    }
  }
  function parse(template) {
    const context = createContext(template)
    const nodes = parseChildren(context, template)
    console.log(4444, nodes)
  }

  // packages/compiler-core/src/index.ts
  function compile(template) {
    const templateAST = parse(template)
    console.log('ast', templateAST)
  }
  return __toCommonJS(src_exports)
})()
//# sourceMappingURL=compiler-core.global.js.map
