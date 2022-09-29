import { NodeTypes } from "../src/ast"

const isText = (node) => {
    return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION
}


export function transformElement(node, context) {
    if (node.type === NodeTypes.ROOT || node.type === NodeTypes.ELEMENT)
    return () => {
        const { children } = node
        let container = null
        let hasText = false
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (isText(child)) {
                hasText = true;
                for (let j = i + 1; j < children.length; j++) {
                    if (isText(children[j])) {
                        if (!container) {
                            container = children[i]
                            container.type = NodeTypes.COMPOUND_EXPRESSION
                            container.children = [child]
                        } else {
                            container.children.push('+', children[j])
                        }
                        children.splice(j, 1)
                        j--
                    }
                }
            } else {
                container = null;
                break;
            }
        }

        if (!hasText || children.length === 1) {
            return;
        }
        

    }
}