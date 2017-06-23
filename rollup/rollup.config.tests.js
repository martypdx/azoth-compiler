import multiEntry from 'rollup-plugin-multi-entry';

export default {
    entry: 'tests/**/*.test.js',
    format: 'cjs',
    plugins: [
        multiEntry()
    ],
    external:  [
        'mocha', 'chai',
        'acorn', 'acorn/dist/walk.es', 'astring', 'htmlparser2',
        'magic-string', 'undeclared'
    ],
    intro: `require('source-map-support').install();`,
    paths:     { 
        'acorn/dist/walk.es': 'acorn/dist/walk' 
    },
    dest: 'build/tests-bundle.js',
    sourceMap: true
};