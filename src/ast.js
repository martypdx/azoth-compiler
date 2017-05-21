import { parse } from 'acorn';

const options = {
    ecmaVersion: 8,
    sourceType: 'module'
};

export default function ast(source) {
    return parse(source, options);
}
