import { parse } from 'acorn';

const DEFAULTS = {
    ecmaVersion: 8,
    sourceType: 'module'
};

export default function ast(source, options) {
    return parse(source, Object.assign({}, DEFAULTS, options));
}
