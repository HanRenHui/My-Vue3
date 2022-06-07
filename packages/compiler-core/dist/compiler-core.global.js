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
  function createParserContext(template) {
    return {
      line: 1,
      column: 1,
      offset: 0,
      source: template,
      originSource: template
    };
  }
  function isEnd(context) {
    return !context.source.length;
  }
  function getCursor(context) {
    return {
      line: context.line,
      column: context.column,
      offset: context.offset
    };
  }
  function advancePositionWithMutation(context, source, endIndex) {
    let lineCount = 0;
    let linePos = -1;
    for (let i = 0; i < endIndex; i++) {
      if (source.charCodeAt(i) === 10) {
        lineCount++;
        linePos = i;
      }
    }
    context.line += lineCount;
    context.offset += endIndex;
    context.column = linePos === -1 ? context.column + endIndex : endIndex - linePos;
  }
  function advanceBy(context, endIndex) {
    const resource = context.source;
    advancePositionWithMutation(context, resource, endIndex);
    context.source = context.source.slice(endIndex);
  }
  function parseTextData(context, endIndex) {
    const rawText = context.source.slice(0, endIndex);
    advanceBy(context, endIndex);
    return rawText;
  }
  function getSelection(context, start, end) {
    end = end ? end : getCursor(context);
    return {
      start,
      end,
      source: context.originSource.slice(start.offset, end.offset)
    };
  }
  function parseText(context) {
    const endTokens = ["<", "{{"];
    let endIndex = context.source.length;
    for (let i = 0; i < endTokens.length; i++) {
      const index = context.source.indexOf(endTokens[i]);
      if (index !== -1 && endIndex > index) {
        endIndex = index;
      }
    }
    const start = getCursor(context);
    const content = parseTextData(context, endIndex);
    return {
      type: 2 /* TEXT */,
      content,
      loc: getSelection(context, start)
    };
  }
  function parseInterpolation(context) {
    const outerStart = getCursor(context);
    advanceBy(context, 2);
    const innerEndIndex = context.source.indexOf("}}");
    const preContent = context.source.slice(0, innerEndIndex);
    const innerContent = preContent.trim();
    const innerStartIndex = preContent.indexOf(innerContent);
    advanceBy(context, innerStartIndex);
    const innerStart = getCursor(context);
    advanceBy(context, innerContent.length);
    const innerEnd = getCursor(context);
    const rightIndex = context.source.indexOf("}}");
    advanceBy(context, rightIndex + 2);
    return {
      type: 5 /* INTERPOLATION */,
      content: {
        type: 4 /* SIMPLE_EXPRESSION */,
        content: innerContent,
        loc: getSelection(context, innerStart, innerEnd)
      },
      loc: getSelection(context, outerStart)
    };
  }
  function parse(template) {
    const context = createParserContext(template);
    let nodes = [];
    while (!isEnd(context)) {
      const source = context.source;
      let node;
      if (source.startsWith("{{")) {
        node = parseInterpolation(context);
      } else if (source.startsWith("<")) {
      }
      if (!node) {
        node = parseText(context);
      }
      nodes.push(node);
      console.log("node", node);
      break;
    }
  }
  function compile(template) {
    const templateAST = parse(template);
    console.log("ast", templateAST);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=compiler-core.global.js.map
