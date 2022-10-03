var VueCompilerCore = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/compiler-core/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    compile: () => compile
  });

  // packages/compiler-core/src/parse.ts
  function advancePositionWithMutation(context, source, endIndex) {
    let linsCount = 0;
    let linePos = -1;
    for (let i = 0; i < endIndex; i++) {
      if (source.charCodeAt(i) == 10) {
        linsCount++;
        linePos = i;
      }
    }
    context.line += linsCount;
    if (linePos === -1) {
      context.column += endIndex;
    } else {
      context.column = endIndex - linePos;
    }
    context.offset += endIndex;
  }
  function advanceBy(context, endIndex) {
    advancePositionWithMutation(context, context.source, endIndex);
    context.source = context.source.slice(endIndex);
  }
  function parseTextData(context, endIndex) {
    const rawText = context.source.slice(0, endIndex);
    advanceBy(context, endIndex);
    return rawText;
  }
  function getCursor(context) {
    const { line, column, offset } = context;
    return {
      line,
      column,
      offset
    };
  }
  function getSelection(context, start, end) {
    end = end || getCursor(context);
    return {
      start,
      end,
      source: context.originSource.slice(start.offset, end.offset)
    };
  }
  function parseText(context) {
    const endTokens = ["{{", "<"];
    let lastIndex = context.source.length;
    for (let i = 0; i < endTokens.length; i++) {
      const index = context.source.indexOf(endTokens[i]);
      if (index !== -1 && lastIndex > index) {
        lastIndex = index;
      }
    }
    const start = getCursor(context);
    const content = parseTextData(context, lastIndex);
    return {
      type: 2 /* TEXT */,
      loc: getSelection(context, start),
      content
    };
  }
  function parseInterception(context) {
    const outerStart = getCursor(context);
    const closeIndex = context.source.indexOf("}}");
    advanceBy(context, 2);
    const innerStart = getCursor(context);
    const innerEnd = getCursor(context);
    const originContent = parseTextData(context, closeIndex - 2);
    const content = originContent.trim();
    const startOffset = originContent.indexOf(content);
    if (startOffset) {
      advancePositionWithMutation(innerStart, originContent, startOffset);
    }
    const endOffset = startOffset + content.length;
    advancePositionWithMutation(innerEnd, originContent, endOffset);
    advanceBy(context, 2);
    return {
      type: 5 /* INTERPOLATION */,
      content: {
        type: 4 /* SIMPLE_EXPRESSION */,
        content,
        loc: getSelection(context, innerStart, innerEnd)
      },
      loc: getSelection(context, outerStart)
    };
  }
  function advanceBySpaces(context) {
    const reg = /^[ \r\n\t]*/;
    const match = reg.exec(context.source);
    if (match) {
      advanceBy(context, match[0].length);
    }
  }
  function parseAttributeValue(context) {
    const start = getCursor(context);
    const quote = context.source[0];
    let content = "";
    if (quote === '"' || quote === "'") {
      advanceBy(context, 1);
      const closeIndex = context.source.indexOf(quote);
      content = parseTextData(context, closeIndex);
      advanceBy(context, 1);
    }
    return {
      content,
      loc: getSelection(context, start),
      type: 2 /* TEXT */
    };
  }
  function parseAttribute(context) {
    const start = getCursor(context);
    const match = /^[^\s=]+/.exec(context.source);
    const name = match[0];
    advanceBy(context, name.length);
    advanceBySpaces(context);
    advanceBy(context, 1);
    advanceBySpaces(context);
    const value = parseAttributeValue(context);
    return {
      start,
      loc: getSelection(context, start),
      name,
      value,
      type: 6 /* ATTRIBUTE */
    };
  }
  function parseAttributes(context) {
    const props = [];
    while (context.source && !context.source.startsWith(">")) {
      const prop = parseAttribute(context);
      props.push(prop);
      advanceBySpaces(context);
    }
    return props;
  }
  function parseTag(context) {
    const start = getCursor(context);
    const reg = /^<\/?([a-z][^ \t\r\n/>]*)/;
    const match = reg.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length);
    advanceBySpaces(context);
    const isSelfClosing = context.source.startsWith("</");
    const props = parseAttributes(context);
    advanceBy(context, isSelfClosing ? 2 : 1);
    return {
      type: 1 /* ELEMENT */,
      isSelfClosing,
      tag,
      props,
      children: [],
      loc: getSelection(context, start)
    };
  }
  function parseElement(context) {
    const ele = parseTag(context);
    const nodes = parseChildren(context);
    if (context.source.startsWith("</")) {
      parseTag(context);
    }
    ele.children = nodes;
    return ele;
  }
  function parseChildren(context) {
    const nodes = [];
    let node = null;
    while (context.source && !context.source.startsWith("</")) {
      if (context.source.startsWith("<")) {
        node = parseElement(context);
      } else if (context.source.startsWith("{{")) {
        node = parseInterception(context);
      } else {
        node = parseText(context);
      }
      nodes.push(node);
    }
    return nodes;
  }
  function createContext(source) {
    return {
      originSource: source,
      source,
      line: 1,
      column: 1,
      offset: 0
    };
  }
  function parse(template) {
    const context = createContext(template);
    const nodes = parseChildren(context);
    return nodes;
  }

  // packages/compiler-core/src/index.ts
  function compile(template) {
    const templateAST = parse(template);
    console.log("ast", templateAST);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=compiler-core.global.js.map
