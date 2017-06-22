const pkg = require('./package.json');

export default {
    entry: 'src/index.js',
    format: 'es',
    moduleName: 'diamond-compiler',
    external: [
      'acorn',
      'acorn/dist/walk.es',
      'astring',
      'htmlparser2'
    ],
    targets: [
      { dest: pkg.main, format: 'cjs' },
      { dest: pkg.module, format: 'es' }
    ]
};