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

  // packages/compiler-core/src/runtimeHelpers.ts
  var TO_DISPLAY_STRING = Symbol.for("toDisplayString");
  var CREATE_TEXT = Symbol.for("createTextVnode");
  var helperMap = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_TEXT]: "createTextVnode"
  };

  // packages/compiler-core/src/ast.ts
  function createCallExpression(context, args) {
    const callee = context.helper(CREATE_TEXT);
    return {
      callee,
      arguments: args,
      type: 14 /* JS_CALL_EXPRESSION */
    };
  }
  function createObjectExpression(propirties) {
    return {
      type: 15 /* JS_OBJECT_EXPRESSION */,
      propirties
    };
  }
  function createVnodeCall(context, tag, propirties, children) {
    return {
      type: 13 /* VNODE_CALL */,
      tag,
      propirties,
      children
    };
  }

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
    const match = /^[^\r\n\t\f=]+/.exec(context.source);
    const name = match[0];
    advanceBy(context, name.length);
    advanceBySpaces(context);
    advanceBy(context, 1);
    advanceBySpaces(context);
    const value = parseAttributeValue(context);
    return {
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
    nodes.forEach((node2, i) => {
      if (node2.type === 2 /* TEXT */ && /^[\r\n\t\f ]*$/.exec(node2.content)) {
        nodes[i] = null;
      }
    });
    return nodes.filter(Boolean);
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
  function createRootNode(children, loc) {
    return {
      type: 0 /* ROOT */,
      loc,
      children
    };
  }
  function parse(template) {
    const context = createContext(template);
    const start = getCursor(context);
    const nodes = parseChildren(context);
    const RootNode = createRootNode(nodes, getSelection(context, start));
    return RootNode;
  }

  // packages/compiler-core/transforms/transformElement.ts
  function transformElement(node, context) {
    if (node.type === 1 /* ELEMENT */) {
      return () => {
        const props = node.props || {};
        const propirties = [];
        for (const key in props) {
          const value = props[key];
          propirties.push({
            key,
            value: value.content
          });
        }
        const propertyExpression = propirties.length ? createObjectExpression(propirties) : null;
        let childrenNodes = null;
        if (node.children.length === 1) {
          childrenNodes = node.children[0];
        } else {
          childrenNodes = node.children;
        }
        node.codegenNode = createVnodeCall(context, node.tag, propertyExpression, childrenNodes);
      };
    }
  }

  // packages/compiler-core/transforms/transformExpression.ts
  function transformExpression(node, context) {
    if (node.type === 5 /* INTERPOLATION */) {
      const content = node.content.content;
      node.content.content = `_ctx.${content}`;
    }
  }

  // packages/compiler-core/transforms/transformText.ts
  function isText(node) {
    return node.type === 2 /* TEXT */ || node.type === 5 /* INTERPOLATION */;
  }
  function transformText(node, context) {
    if (node.type === 0 /* ROOT */ || node.type === 1 /* ELEMENT */) {
      return () => {
        console.log(node);
        const children = node.children;
        let hasText = false;
        for (let i = 0; i < children.length; i++) {
          const curChildren = children[i];
          let currentContainer = null;
          if (isText(curChildren)) {
            hasText = true;
            for (let j = i + 1; j < children.length; j++) {
              const nextChildren = children[j];
              if (isText(nextChildren)) {
                if (!currentContainer) {
                  currentContainer = children[i] = {
                    type: 8 /* COMPOUND_EXPRESSION */,
                    children: [curChildren]
                  };
                }
                currentContainer.children.push(`+`, nextChildren);
                children.splice(j, 1);
                j--;
              } else {
                currentContainer = null;
                break;
              }
            }
          }
        }
        if (!hasText || children.length === 1) {
          return;
        }
        for (let i = 0; i < children.length; i++) {
          const curChild = children[i];
          const args = [curChild];
          if (isText(curChild) || curChild.type === 8 /* COMPOUND_EXPRESSION */) {
            if (curChild.type !== 2 /* TEXT */) {
              args.push(1 /* TEXT */);
            }
            children[i] = {
              type: 12 /* TEXT_CALL */,
              content: curChild,
              codegenNode: createCallExpression(context, args)
            };
          }
        }
      };
    }
  }

  // packages/compiler-core/src/transform.ts
  function createTransformContext() {
    const context = {
      parent: null,
      currentNode: null,
      helpers: /* @__PURE__ */ new Map(),
      helper(name) {
        const count = context.helpers.get(name) || 0;
        context.helpers[name] = count + 1;
        return name;
      },
      nodeTransforms: [transformElement, transformText, transformExpression]
    };
    return context;
  }
  function traverse(ast, context) {
    const currentNode = context.currentNode = ast;
    const transforms = context.nodeTransforms;
    const exitFns = [];
    for (let i2 = 0; i2 < transforms.length; i2++) {
      const exitFn = transforms[i2](ast, context);
      if (typeof exitFn === "function") {
        exitFns.push(exitFn);
      }
    }
    switch (currentNode.type) {
      case 5 /* INTERPOLATION */:
        context.helper(TO_DISPLAY_STRING);
        break;
      case 1 /* ELEMENT */:
      case 0 /* ROOT */:
        const children = currentNode.children;
        for (let i2 = 0; i2 < children.length; i2++) {
          traverse(children[i2], context);
        }
    }
    context.currentNode = ast;
    let i = 0;
    while (i < exitFns.length) {
      exitFns[i]();
      i++;
    }
  }
  function createRootCodegen(ast, context) {
  }
  function transform(ast) {
    const context = createTransformContext();
    traverse(ast, context);
    debugger;
    createRootCodegen(ast, context);
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
