import { parse } from './parse'
import { transform } from './transform'

export function compile(template) {
    const templateAST = parse(template)

    console.log('ast', templateAST)  

    // const jsAST = transform(templateAST)
    
    // console.log('jsAst', jsAST)
}
