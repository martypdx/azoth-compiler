import { base } from 'acorn/dist/walk.es';
import parseTemplate from '../parse/parse-template';
import { templateAFE, TTEtoAFE, renderer } from '../transformers/template';
import { initBinder } from '../transformers/binding';

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
    const { fragments, binders } = state;

    body.splice(0, 0, 
        ...fragments.map(renderer), 
        ...binders.map(initBinder));
};

export const ImportDeclaration = ({ source, specifiers }, { name, imports }) => {
    if(!source.value.endsWith(name)) return;
    imports.specifiers = specifiers;
};