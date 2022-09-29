import { transformElement } from "../transforms/transformElement"
import { transformExpression } from "../transforms/transformExpression"
import { transformText } from "../transforms/transformText"
import { NodeTypes } from "./ast"

function createTransformContext() {
    const context = {
        currentNode: null,
        parent: null,
        helpers: new Map(),
        helper(name) {
            const count = this.helpers.get(name) || 0
            this.helpers.set(name, count + 1);
        },
        transforms: [
            transformElement,
            transformText,
            transformExpression,
        ]
    }

    return context
}

function traverse(node, context) {
    context.currentNode = node
    const onExit = []
    for (let i = 0; i < context.transforms.length; i++) {
        const exitFn = context.transforms[i](node, context)
        if (exitFn) {
            onExit.push(exitFn)
        }
        if (!context.currentNode) return;
    }
    switch(node.type) {
        case NodeTypes.INTERPOLATION:
            break;
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            for (let i = 0;  i < node.children.length; i++) {
                context.parent = context.currentNode
                traverse(node.children[i], context);
            }
            break;
    }

    context.currentNode = node;
    let i = onExit.length - 1;
    while(i >= 0) {
        onExit[i]()
        i--
    }
}

export function transform(ast) {
    const context = createTransformContext()
    traverse(ast, context)
}