import { generate } from './codegen'
import { parse } from './parse'
import { transform } from './transform'

export function compile(template) {
  const templateAST = parse(template)

  const jsAST = transform(templateAST)
  console.log(444, jsAST)
  const code = generate(jsAST)

  console.log(code)
}
