import { simple, base } from 'acorn/dist/walk';
import { Globals } from './globals';
import parse from '../ast';
import { generate } from 'astring';
import parseTemplate from '../parse/parse-template';
import { templateAFE, TTEtoAFE, renderer } from '../transformers/template';
import { specifier } from '../transformers/common';
import { initBinder } from '../transformers/binding';
import { RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT } from '../transformers/identifiers';


// TODO: expose as config?
const TAG = '_';
const MODULE_NAME = 'diamond';
const SPECIFIER_NAME = 'html';

export default function compile(source) {
    const ast = parse(source);

    // TODO: leverage findImport
    let tag = TAG;
    const globals = new Globals();
   
    simple(ast, {
        TaggedTemplateExpression(node, globals) {
            console.log('TTE');
            if (node.tag.name !== tag) return;
            const { html, binders } = parseTemplate(node.quasi);
            const index = globals.addFragment(html);
            binders.forEach(b => b.moduleIndex = globals.addBinder(b));
            
            const newAst = templateAFE({ binders, index });
            TTEtoAFE(node, newAst);
        },
        Program(node, { fragments, binders, specifiers }) {
            node.body.splice(0, 0, 
                ...fragments.map(renderer), 
                ...binders.map(initBinder));

            const binderImports = binders.map(b => specifier(b.name));
            specifiers.push(...binderImports);
        },
        ImportDeclaration({ source, specifiers }, globals) {
            if(!source.value.endsWith(MODULE_NAME)) return;
            
            const index = specifiers.findIndex(({ imported }) => imported.name === SPECIFIER_NAME); 
            global.tag = specifiers[index];
            if(index > -1) specifiers.splice(index, 1);

            const imports = [RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT].map(specifier);
            specifiers.push(...imports);
            globals.specifiers = specifiers;
        }

    }, base, globals);

    return generate(ast);
}