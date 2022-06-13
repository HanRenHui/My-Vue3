import { NodeTypes } from "./ast"
// there still has some problems

function createParserContext(template) {
    return {
        line: 1,
        column: 1,
        offset: 0,
        source: template,
        originSource: template
    }
}

function isEnd(context) {
    if (context.source.startsWith('</')) return true;
    return !context.source.length
}

function getCursor(context) {
    return {
        line: context.line,
        column: context.column,
        offset: context.offset
    }
}

function advancePositionWithMutation(context, source, endIndex) {
    // 换行符的个数
    let lineCount = 0
    // 最后一个换行符的位置
    let linePos = -1
    for (let i = 0; i < endIndex; i++) {
        if (source.charCodeAt(i) === 10) {
            lineCount ++
            linePos = i
        }
    }
    context.line += lineCount
    context.offset += endIndex
    context.column = linePos === -1 ? context.column + endIndex : endIndex - linePos
}

function advanceBy(context, endIndex) {
    const resource = context.source
    // 每次删掉内容的时候 都要更新最新的行列和偏移量信息
    advancePositionWithMutation(context, resource, endIndex)
    context.source = context.source.slice(endIndex)
}

function parseTextData(context, endIndex) {
    const rawText  = context.source.slice(0, endIndex)
    advanceBy(context, endIndex)
    return rawText
}

function getSelection(context, start, end?) {
    end = end ? end : getCursor(context)
    return {
        start,
        end,
        source: context.originSource.slice(start.offset, end.offset)
    }
    
}

function parseText(context) {
    const endTokens = ['<', '{{']

    let endIndex = context.source.length
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i])
        if (index !== -1 && endIndex > index) {
            endIndex = index
        }
    }
    // 创建行列信息 用来报错用
    const start = getCursor(context)

    // 获取内容
    const content = parseTextData(context, endIndex)


    // 返回文本节点信息
    return {
        type: NodeTypes.TEXT,
        content,
        loc: getSelection(context, start)
    }
}


function parseInterpolation(context){ // 处理表达式的信息 
    const start = getCursor(context); // xxx  }}
    const closeIndex = context.source.indexOf('}}',2); // 查找结束的大括号
    advanceBy(context,2); // {{  xx }}
    const innerStart = getCursor(context);
    const innerEnd = getCursor(context); // advancePositionWithMutation

    // 拿到原始的内容 
    const rawContentLength = closeIndex - 2; // 原始内容的长度
    let  preContent = parseTextData(context,rawContentLength); // 可以返回文本内容，是并且可以更新信息
    let content = preContent.trim();
    let startOffset = preContent.indexOf(content)//   {{  xxxx}}

    if(startOffset > 0){
        advancePositionWithMutation(innerStart,preContent,startOffset)
    }
    let endOffset = startOffset + content.length
    advancePositionWithMutation(innerEnd,preContent,endOffset)
    advanceBy(context,2);
    return {
        type:NodeTypes.INTERPOLATION, // 表达式
        content:{
            type:NodeTypes.SIMPLE_EXPRESSION,
            content,
            loc:getSelection(context,innerStart,innerEnd)
        },
        loc:getSelection(context,start) // 表达式相关的信息
    }
}


function advanceSpace(context) {
    const spaces = /^\s*/.exec(context.source)
    advanceBy(context, spaces[0].length)
}

function parseAttributeValue(context) {
    const start = getCursor(context);
    const quote = context.source[0]
    let content
    if (quote === "'" || quote === '"') {
        advanceBy(context, 1)
        const endIndex = context.source.indexOf(quote)
        content = parseTextData(context, endIndex)
        advanceBy(context, 1)
    }
    return {
        content,
        loc: getSelection(context, start)
    }
}

function parseAttribute(context) {
    const start = getCursor(context);
    const matched = /^([^\s=/>]+)/.exec(context.source)
    const attributeName = matched[0]
    advanceBy(context, attributeName.length)
    advanceSpace(context)
    advanceBy(context, 1); // 去掉=
    advanceSpace(context)
    const value = parseAttributeValue(context);
    advanceSpace(context)
    return {
        type: NodeTypes.ATTRIBUTE,
        name: attributeName,
        value: {
            type: NodeTypes.TEXT,
            ...value
        },
        loc: getSelection(context, start)
    }
}

function parseAttributes(context) {
    const props = []
    while (context.source.length && context.source[0] !== '>') {
        const prop = parseAttribute(context)
        props.push(prop)
    }
    return props
}

function parseTag(context) {
    const start = getCursor(context)
    const matched = /^<\/?([a-z][^\s\/>]*)/.exec(context.source)
    const tag = matched[1]
    advanceBy(context, matched[0].length)
    // 去除空格
    advanceSpace(context)
    const props = parseAttributes(context)
    advanceSpace(context)
    advanceBy(context, 1) // 去掉>
    return {
        type: NodeTypes.ELEMENT,
        props,
        tag,
        loc: getSelection(context, start),
        children: []
    }
}

function parseChildren(context) {
    let nodes = []

    while(!isEnd(context)) {
        const source = context.source
        let node
      if (source.startsWith('{{')) {
            node = parseInterpolation(context)
        } else if (source.startsWith('<')) { // 标签k
            node = parseElement(context);
        }
        if (!node) {
            // 文本
            node = parseText(context)
        }

        nodes.push(node)
    }

    return nodes;
}

function parseElement(context) {
   const ele = parseTag(context)
   const children = parseChildren(context)
   if (context.source.startsWith('</')) {
       parseTag(context)
   }

    ele.children = children;

    ele.loc = getSelection(context, ele.loc.start)

    return ele;
}

function createRoot(children, loc) {
    return {
        type: NodeTypes.ROOT,
        children,
        loc
    }
}

export function parse(template) {
    // 创建一个解析上下文来进行处理
    const context = createParserContext(template)
    const start = getCursor(context)

    let nodes =  parseChildren(context)

    return createRoot(nodes, getSelection(context, start))
}