export default {
    entry: 'src/index.js',
    moduleName: 'azoth-compiler',
    external: [
        'acorn',
        'acorn/dist/walk.es',
        'astring',
        'estraverse',
        'htmlparser2',
        'rev-hash'
    ]
};