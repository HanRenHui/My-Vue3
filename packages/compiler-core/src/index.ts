import { NodeTypes } from "./ast"

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

function parseInterpolation(context) {
    const outerStart = getCursor(context)

    advanceBy(context, 2)
    
    const innerEndIndex = context.source.indexOf('}}')

    const preContent = context.source.slice(0, innerEndIndex)

    const innerContent = preContent.trim()

    const innerStartIndex = preContent.indexOf(innerContent)

    // abc }}
    advanceBy(context, innerStartIndex)

    const innerStart = getCursor(context)

    advanceBy(context, innerContent.length)

    const innerEnd = getCursor(context)

    // 干掉 }}
    const rightIndex = context.source.indexOf('}}')
    advanceBy(context, rightIndex + 2)


    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: innerContent,
            loc: getSelection(context, innerStart, innerEnd)
        },
        loc: getSelection(context, outerStart)
    }
}

function parse(template) {
    // 创建一个解析上下文来进行处理
    const context = createParserContext(template)
    let nodes = []

    while(!isEnd(context)) {
        const source = context.source
        let node

        if (source.startsWith('{{')) {
            node = parseInterpolation(context)
        } else if (source.startsWith('<')) { // 标签k

        }
        if (!node) {
            // 文本
            node = parseText(context)
        }

        nodes.push(node)
        console.log('node', node)
        break
    }
}

export function compile(template) {
    const templateAST = parse(template)

    console.log('ast', templateAST)

    // const jsAST = transform(templateAST)
}
