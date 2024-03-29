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
  var CREATE_ELEMENT_VNODE = Symbol.for("createElementVNode");
  var CREATE_BLOCK_VNODE = Symbol.for("createBlockVNode");
  var OPEN_BLOCK = Symbol.for("openBlock");
  var FRAGEMENT = Symbol.for("fragment");
  var helperMap = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_TEXT]: "createTextVnode",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
    [CREATE_BLOCK_VNODE]: "createBlockVNode",
    [OPEN_BLOCK]: "openBlock",
    [FRAGEMENT]: "fragement"
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
    context.helper(CREATE_ELEMENT_VNODE);
    return {
      type: 13 /* VNODE_CALL */,
      tag,
      props: propirties,
      children
    };
  }

  // packages/compiler-core/src/codegen.ts
  function createGenerateContext() {
    const ctx = {
      code: "",
      indentLeval: 0,
      push(code) {
        this.code += code;
      },
      newLine() {
        this.push(`
` + "  ".repeat(this.indentLeval));
      },
      indent() {
        this.indentLeval++;
        this.newLine();
      },
      helperMap(name) {
        return `_${helperMap[name]}`;
      },
      dedent() {
        this.indentLeval--;
        this.newLine();
      }
    };
    return ctx;
  }
  function genFunctionPreale(context, ast) {
    if (ast.helpers.length) {
      context.push(`import { ${ast.helpers.map((h) => `${helperMap[h]} as _ ${helperMap[h]}`).join(", ")} } from 'vue'`);
      context.newLine();
    }
  }
  function genCompoundExpression(context, node) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (typeof child === "string") {
        context.push(child);
      } else {
        genNode(context, child);
      }
    }
  }
  function genVNodeCall(context, node) {
    context.push(`${context.helperMap(CREATE_ELEMENT_VNODE)}(`);
    genNodelist(context, [node.tag, node.props, node.children]);
    context.push(")");
  }
  function genInterprolation(context, node) {
    context.push(`_${helperMap[TO_DISPLAY_STRING]}(`);
    genNode(context, node.content);
    context.push(")");
  }
  function genObjectExpression(context, node) {
    context.push("{");
    context.push(`${node.propirties.map((p) => `${p.key}: ${p.value}`).join(",")}`);
    context.push("}");
  }
  function genNodelistAsArray(context, nodes) {
    context.push("[");
    genNodelist(context, nodes);
    context.push("]");
  }
  function genNodelist(context, nodes = []) {
    for (let i = 0; i < nodes.length; i++) {
      const cur = nodes[i];
      if (typeof cur === "string") {
        context.push(cur);
      } else if (Array.isArray(cur)) {
        genNodelistAsArray(context, cur);
      } else {
        genNode(context, cur);
      }
      if (i < nodes.length - 1) {
        context.push(",");
      }
    }
  }
  function genCallExpression(context, node) {
    const name = context.helperMap(node.callee);
    context.push(`${name}(`);
    genNodelist(context, node.arguments);
    context.push(")");
  }
  function genText(context, node) {
    context.push(JSON.stringify(node.content));
  }
  function genExpression(context, node) {
    context.push(node.content);
  }
  function genNode(context, node) {
    switch (node.type) {
      case 2 /* TEXT */:
        genText(context, node);
        break;
      case 12 /* TEXT_CALL */:
        genNode(context, node.codegenNode);
        break;
      case 8 /* COMPOUND_EXPRESSION */:
        genCompoundExpression(context, node);
        break;
      case 5 /* INTERPOLATION */:
        genInterprolation(context, node);
        break;
      case 1 /* ELEMENT */:
        genNode(context, node.codegenNode);
        break;
      case 13 /* VNODE_CALL */:
        genVNodeCall(context, node);
        break;
      case 15 /* JS_OBJECT_EXPRESSION */:
        genObjectExpression(context, node);
        break;
      case 14 /* JS_CALL_EXPRESSION */:
        genCallExpression(context, node);
        break;
      case 4 /* SIMPLE_EXPRESSION */:
        genExpression(context, node);
        break;
    }
  }
  function generate(ast) {
    const context = createGenerateContext();
    genFunctionPreale(context, ast);
    const functionName = "render";
    const args = ["_ctx"];
    context.push(`function ${functionName}( ${args.join(",")} ) {`);
    context.indent();
    context.push("return ");
    if (ast.codegenNode) {
      genNode(context, ast.codegenNode);
    } else {
      return null;
    }
    context.dedent();
    context.push("}");
    console.log(context.code);
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

  // packages/compiler-core/src/transforms/transformElement.ts
  function transformElement(node, context) {
    if (node.type === 1 /* ELEMENT */) {
      return () => {
        const props = node.props || {};
        const propirties = [];
        for (let i = 0; i < props.length; i++) {
          const p = props[i];
          propirties.push({
            key: p.name,
            value: JSON.stringify(p.value.content)
          });
        }
        const propertyExpression = propirties.length ? createObjectExpression(propirties) : null;
        let childrenNodes = null;
        if (node.children.length === 1) {
          childrenNodes = node.children[0];
        } else {
          childrenNodes = node.children;
        }
        node.codegenNode = createVnodeCall(context, JSON.stringify(node.tag), propertyExpression, childrenNodes);
      };
    }
  }

  // packages/compiler-core/src/transforms/transformExpression.ts
  function transformExpression(node, context) {
    if (node.type === 5 /* INTERPOLATION */) {
      const content = node.content.content;
      node.content.content = `_ctx.${content}`;
    }
  }

  // packages/shared/src/index.ts
  var PatchFlagNames = {
    [1 /* TEXT */]: `TEXT`,
    [2 /* CLASS */]: `CLASS`,
    [4 /* STYLE */]: `STYLE`,
    [8 /* PROPS */]: `PROPS`,
    [16 /* FULL_PROPS */]: `FULL_PROPS`,
    [32 /* HYDRATE_EVENTS */]: `HYDRATE_EVENTS`,
    [64 /* STABLE_FRAGMENT */]: `STABLE_FRAGMENT`,
    [128 /* KEYED_FRAGMENT */]: `KEYED_FRAGMENT`,
    [256 /* UNKEYED_FRAGMENT */]: `UNKEYED_FRAGMENT`,
    [512 /* NEED_PATCH */]: `NEED_PATCH`,
    [1024 /* DYNAMIC_SLOTS */]: `DYNAMIC_SLOTS`,
    [2048 /* DEV_ROOT_FRAGMENT */]: `DEV_ROOT_FRAGMENT`,
    [-1 /* HOISTED */]: `HOISTED`,
    [-2 /* BAIL */]: `BAIL`
  };

  // packages/compiler-core/src/transforms/transformText.ts
  function isText(node) {
    return node.type === 2 /* TEXT */ || node.type === 5 /* INTERPOLATION */;
  }
  function transformText(node, context) {
    if (node.type === 0 /* ROOT */ || node.type === 1 /* ELEMENT */) {
      return () => {
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
          if (isText(curChild) || curChild.type === 8 /* COMPOUND_EXPRESSION */) {
            const args = [curChild];
            if (curChild.type !== 2 /* TEXT */) {
              args.push(1 /* TEXT */ + `/* ${PatchFlagNames[1 /* TEXT */]} */`);
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
        context.helpers.set(name, count + 1);
        return name;
      },
      removeHelper(name) {
        let count = context.helpers.get(name);
        count--;
        if (count) {
          context.helpers.set(name, count);
        } else {
          context.helpers.delete(count);
        }
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
    const children = ast.children;
    if (children.length === 1) {
      const child = children[0];
      if (child.type === 1 /* ELEMENT */ && child.codegenNode) {
        ast.codegenNode = child.codegenNode;
        ast.codegenNode.isBlock = true;
        context.removeHelper(CREATE_ELEMENT_VNODE);
        context.helper(OPEN_BLOCK);
        context.helper(CREATE_BLOCK_VNODE);
      } else {
        ast.codegenNode = child.codegenNode;
      }
    } else {
      if (!children.length)
        return null;
      context.helper(FRAGEMENT);
      ast.codegenVnode = createVnodeCall(context, FRAGEMENT, null, ast.children);
    }
  }
  function transform(ast) {
    const context = createTransformContext();
    traverse(ast, context);
    createRootCodegen(ast, context);
    ast.helpers = [...context.helpers.keys()];
    return ast;
  }

  // packages/compiler-core/src/index.ts
  function compile(template) {
    const templateAST = parse(template);
    const jsAST = transform(templateAST);
    console.log(444, jsAST);
    const code = generate(jsAST);
    console.log(code);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=compiler-core.global.js.map
