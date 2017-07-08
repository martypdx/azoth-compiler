import { parse as acornParse } from 'acorn';
import { generate as astringGenerate, baseGenerator } from 'astring';

const ACORN_DEFAULTS = {
    ecmaVersion: 8,
    sourceType: 'module'
};

export function parse(source, options) {
    return acornParse(source, Object.assign({}, ACORN_DEFAULTS, options));
}

// work around for https://github.com/davidbonnet/astring/issues/21
const generator = Object.assign({}, baseGenerator, {
    ArrowFunctionExpression: function(node, state) {
        state.write('(');
        baseGenerator.ArrowFunctionExpression(node, state);
        state.write(')');
    }
});

const ASTRING_DEFAULTS = { 
    ident: '    ',
    generator 
};

export function generate(ast, options) {
    return astringGenerate(ast, Object.assign({}, ASTRING_DEFAULTS, options));
}