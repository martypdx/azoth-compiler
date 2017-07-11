import { parse as acornParse } from 'acorn';
import { generate as astringGenerate } from 'astring';

const ACORN_DEFAULTS = {
    ecmaVersion: 8,
    sourceType: 'module'
};

export function parse(source, options) {
    return acornParse(source, Object.assign({}, ACORN_DEFAULTS, options));
}

const ASTRING_DEFAULTS = { 
    ident: '    '
};

export function generate(ast, options) {
    return astringGenerate(ast, Object.assign({}, ASTRING_DEFAULTS, options));
}