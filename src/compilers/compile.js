import { simple, base } from 'acorn/dist/walk';
import { Globals } from './globals';
import parse from '../ast';
import { generate } from 'astring';
import parseTemplate from '../parse/parse-template';
import { 
    templateAFE, 
    TTEtoAFE,
    renderer } from '../transformers/template';
import { initBinder } from '../transformers/binding';

const TAG = '_';
const MODULE_NAME = 'diamond';
const SPECIFIER_NAME = 'html';

export default function compile(source) {
    const ast = parse(source);

    // TODO: leverage findImport
    let tag = TAG;
    let specifier;
    const globals = new Globals();
   
    simple(ast, {
        TaggedTemplateExpression(node, globals) {
            if (node.tag.name !== tag) return;
            const { html, binders } = parseTemplate(node.quasi);
            const index = globals.addFragment(html);
            binders.forEach(b => b.moduleIndex = globals.addBinder(b));
            
            const newAst = templateAFE({ binders, index });
            TTEtoAFE(node, newAst);
        },
        Program(node, globals) {
            const renderers = globals.fragments.map(renderer);
            const binders = globals.binders.map(initBinder);
            node.body.splice(0, 0, ...renderers, ...binders);
        },
        ImportDeclaration(node) {
            // TODO: expose as config so we don't have this weakish test
            if(!node.source.value.endsWith(MODULE_NAME)) return;
            specifier = node.specifiers.find(({ imported }) => imported.name === SPECIFIER_NAME);
            console.log('import!', specifier);
        }

    }, base, globals);

    return generate(ast);
}