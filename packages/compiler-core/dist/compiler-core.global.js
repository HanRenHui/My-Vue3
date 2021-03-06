var VueCompilerCore = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
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
    if (context.source.startsWith("</"))
      return true;
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
    const start = getCursor(context);
    const closeIndex = context.source.indexOf("}}", 2);
    advanceBy(context, 2);
    const innerStart = getCursor(context);
    const innerEnd = getCursor(context);
    const rawContentLength = closeIndex - 2;
    let preContent = parseTextData(context, rawContentLength);
    let content = preContent.trim();
    let startOffset = preContent.indexOf(content);
    if (startOffset > 0) {
      advancePositionWithMutation(innerStart, preContent, startOffset);
    }
    let endOffset = startOffset + content.length;
    advancePositionWithMutation(innerEnd, preContent, endOffset);
    advanceBy(context, 2);
    return {
      type: 5 /* INTERPOLATION */,
      content: {
        type: 4 /* SIMPLE_EXPRESSION */,
        content,
        loc: getSelection(context, innerStart, innerEnd)
      },
      loc: getSelection(context, start)
    };
  }
  function advanceSpace(context) {
    const spaces = /^\s*/.exec(context.source);
    advanceBy(context, spaces[0].length);
  }
  function parseAttributeValue(context) {
    const start = getCursor(context);
    const quote = context.source[0];
    let content;
    if (quote === "'" || quote === '"') {
      advanceBy(context, 1);
      const endIndex = context.source.indexOf(quote);
      content = parseTextData(context, endIndex);
      advanceBy(context, 1);
    }
    return {
      content,
      loc: getSelection(context, start)
    };
  }
  function parseAttribute(context) {
    const start = getCursor(context);
    const matched = /^([^\s=/>]+)/.exec(context.source);
    const attributeName = matched[0];
    advanceBy(context, attributeName.length);
    advanceSpace(context);
    advanceBy(context, 1);
    advanceSpace(context);
    const value = parseAttributeValue(context);
    advanceSpace(context);
    return {
      type: 6 /* ATTRIBUTE */,
      name: attributeName,
      value: __spreadValues({
        type: 2 /* TEXT */
      }, value),
      loc: getSelection(context, start)
    };
  }
  function parseAttributes(context) {
    const props = [];
    while (context.source.length && context.source[0] !== ">") {
      const prop = parseAttribute(context);
      props.push(prop);
    }
    return props;
  }
  function parseTag(context) {
    const start = getCursor(context);
    const matched = /^<\/?([a-z][^\s\/>]*)/.exec(context.source);
    const tag = matched[1];
    advanceBy(context, matched[0].length);
    advanceSpace(context);
    const props = parseAttributes(context);
    advanceSpace(context);
    advanceBy(context, 1);
    return {
      type: 1 /* ELEMENT */,
      props,
      tag,
      loc: getSelection(context, start),
      children: []
    };
  }
  function parseChildren(context) {
    let nodes = [];
    while (!isEnd(context)) {
      const source = context.source;
      let node;
      if (source.startsWith("{{")) {
        node = parseInterpolation(context);
      } else if (source.startsWith("<")) {
        node = parseElement(context);
      }
      if (!node) {
        node = parseText(context);
      }
      nodes.push(node);
    }
    return nodes;
  }
  function parseElement(context) {
    const ele = parseTag(context);
    const children = parseChildren(context);
    if (context.source.startsWith("</")) {
      parseTag(context);
    }
    ele.children = children;
    ele.loc = getSelection(context, ele.loc.start);
    return ele;
  }
  function createRoot(children, loc) {
    return {
      type: 0 /* ROOT */,
      children,
      loc
    };
  }
  function parse(template) {
    const context = createParserContext(template);
    const start = getCursor(context);
    let nodes = parseChildren(context);
    return createRoot(nodes, getSelection(context, start));
  }

  // packages/compiler-core/src/transform.ts
  function transformElement(node, context) {
    console.log("1 in", node.tag, context.currentNode.tag);
    return () => {
      console.log("1 out", node.tag, context.currentNode.tag);
    };
  }
  function transformText(node, context) {
    console.log("2 in", node.tag, context.currentNode.tag);
    return () => {
      console.log("2 out", node.tag, context.currentNode);
    };
  }
  function transformExpression(node, context) {
    console.log("3 in", node.tag, context.currentNode.tag);
    return () => {
      console.log("3 out", node.tag, context.currentNode);
    };
  }
  function createTransformContext() {
    const context = {
      currentNode: null,
      parent: null,
      transforms: [
        transformElement,
        transformText,
        transformExpression
      ]
    };
    return context;
  }
  function traverse(node, context) {
    context.currentNode = node;
    const onExit = [];
    for (let i2 = 0; i2 < context.transforms.length; i2++) {
      const exitFn = context.transforms[i2](node, context);
      if (exitFn) {
        onExit.push(exitFn);
      }
      if (!context.currentNode)
        return;
    }
    switch (node.type) {
      case 0 /* ROOT */:
      case 1 /* ELEMENT */:
        for (let i2 = 0; i2 < node.children.length; i2++) {
          context.parent = context.currentNode;
          traverse(node.children[i2], context);
        }
        break;
    }
    context.currentNode = node;
    let i = onExit.length - 1;
    while (i >= 0) {
      onExit[i]();
      i--;
    }
  }
  function transform(ast) {
    const context = createTransformContext();
    traverse(ast, context);
  }

  // packages/compiler-core/src/index.ts
  function compile(template) {
    const templateAST = parse(template);
    console.log("ast", templateAST);
    const jsAST = transform(templateAST);
    console.log("jsAst", jsAST);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=compiler-core.global.js.map
