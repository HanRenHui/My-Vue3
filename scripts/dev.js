const argv = require('minimist')(process.argv.slice(2));
const path = require('path')
const { build } = require('esbuild')
const target = argv._[0]

const pkg = require(path.join(__dirname, `../packages/${target}/package.json`))
const format = argv.f

const outfile = path.join(__dirname, `../packages/${target}/dist/${target}.${format}.js`,)


console.log(path.join(__dirname, `../packages/${target}/src/index.ts`))
build({
    entryPoints: [path.join(__dirname, `../packages/${target}/src/index.ts`)],
    outfile,
    bundle: true,
    sourcemap: true,
    format: format.startsWith('global') ? 'iife' : format === 'cjs' ? 'cjs' : 'esm',
    globalName: pkg.buildOptions.name,
    platform: format === 'cjs' ? 'node' : 'browser',
    watch: { // 监控文件变化
        onRebuild(error) {
            if (!error) console.log(`rebuilt~~~~`)
        }
    }
}).then(() => {
    console.log('watching~~~')
})