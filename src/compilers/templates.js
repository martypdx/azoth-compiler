import { base } from 'acorn/dist/walk.es';
import parseTemplate from '../parse/parse-template';
import { templateAFE, TTEtoAFE, renderer } from '../transformers/template';
import { specifier } from '../transformers/common';
import { initBinder } from '../transformers/binding';
import { RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT } from '../transformers/identifiers';

const MODULE_NAME = 'diamond';
const SPECIFIER_NAME = 'html';

export const TaggedTemplateExpression = (node, state, c) => {
    base.TaggedTemplateExpression(node, state, c);

    if (node.tag.name !== state.tag) return;
    const { html, binders } = parseTemplate(node.quasi);
    const index = state.addFragment(html);

    binders.forEach(b => {
        b.matchObservables(state.scope);
        b.moduleIndex = state.addBinder(b);
    });
    
    const newAst = templateAFE({ binders, index });
    TTEtoAFE(node, newAst);
};

export const Program = (node, state, c) => {
    base.Program(node, state, c);

    const { body } = node;
    const { fragments, binders, imports, specifiers } = state;

    body.splice(0, 0, 
        ...fragments.map(renderer), 
        ...binders.map(initBinder));

    if(specifiers) {
        const binderImports = imports.map(name => specifier(name));
        specifiers.push(...binderImports);
    }
};

export const ImportDeclaration = (node, state, c) => {
    base.ImportDeclaration(node, state, c);
    
    const { source, specifiers } = node;
    if(!source.value.endsWith(MODULE_NAME)) return;
    
    state.specifiers = specifiers;
    const imports = [RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT].map(specifier);
    specifiers.push(...imports);
    
    const index = specifiers.findIndex(({ imported }) => imported.name === SPECIFIER_NAME); 
    if(index > -1) {
        state.tag = specifiers[index].local.name;
        specifiers.splice(index, 1);
    }
};