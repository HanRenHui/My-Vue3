import { NodeTypes } from "./ast"

function transformElement(node, context) {
    console.log('1 in', node.tag, context.currentNode.tag)
    return () => {
        console.log('1 out', node.tag, context.currentNode.tag)
    }
}

function transformText(node, context) {
    console.log("2 in", node.tag, context.currentNode.tag)
    return () => {
        console.log('2 out', node.tag, context.currentNode)
    }
}

function transformExpression(node, context) {
    console.log('3 in', node.tag, context.currentNode.tag)
    return () => {
        console.log('3 out', node.tag, context.currentNode)
    }
}

function createTransformContext() {
    const context = {
        currentNode: null,
        parent: null,
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