export default {
    entry: 'src/index.js',
    moduleName: 'diamond-compiler',
    external: [
        'acorn',
        'acorn/dist/walk.es',
        'astring',
        'htmlparser2'
    ]
};