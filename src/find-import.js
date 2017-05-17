import { recursive } from 'acorn/dist/walk';

const MODULE_NAME = 'diamond';
const SPECIFIER_NAME = 'html';

export default function findImport(ast) {
    let specifier = null;
    recursive(ast, {}, {
        ImportDeclaration(node) {
            // TODO: expose as config so we don't have this weakish test
            // if(node.source.value !== MODULE_NAME) return;
            if(!node.source.value.endsWith(MODULE_NAME)) return;
            specifier = node.specifiers.find(({ imported }) => imported.name === SPECIFIER_NAME);
        }
    });
    return specifier;
}