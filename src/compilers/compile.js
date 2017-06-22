import { simple, base } from 'acorn/dist/walk.es';
import { Globals } from './globals';
import parse from '../ast';
import { generate } from 'astring';
import parseTemplate from '../parse/parse-template';
import { templateAFE, TTEtoAFE, renderer } from '../transformers/template';
import { specifier } from '../transformers/common';
import { initBinder } from '../transformers/binding';
import { RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT } from '../transformers/identifiers';

const MODULE_NAME = 'diamond';
const SPECIFIER_NAME = 'html';

export default function compile(source) {
    const ast = parse(source);

    simple(ast, {
        TaggedTemplateExpression(node, globals) {
            if (node.tag.name !== globals.tag) return;
            const { html, binders } = parseTemplate(node.quasi);
            const index = globals.addFragment(html);
            binders.forEach(b => b.moduleIndex = globals.addBinder(b));
            
            const newAst = templateAFE({ binders, index });
            TTEtoAFE(node, newAst);
        },
        Program({ body }, { fragments, binders, imports, specifiers }) {
            body.splice(0, 0, 
                ...fragments.map(renderer), 
                ...binders.map(initBinder));

            if(specifiers) {
                const binderImports = imports.map(name => specifier(name));
                specifiers.push(...binderImports);
            }
        },
        ImportDeclaration({ source, specifiers }, globals) {
            if(!source.value.endsWith(MODULE_NAME)) return;
            
            globals.specifiers = specifiers;
            const imports = [RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT].map(specifier);
            specifiers.push(...imports);
            
            const index = specifiers.findIndex(({ imported }) => imported.name === SPECIFIER_NAME); 
            if(index > -1) {
                globals.tag = specifiers[index].local.name;
                specifiers.splice(index, 1);
            }
        }

    }, base, new Globals());

    return generate(ast);
}