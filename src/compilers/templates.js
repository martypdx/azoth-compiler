import { base } from 'acorn/dist/walk.es';
import parseTemplate from '../parse/parse-template';
import { templateAFE, TTEtoAFE } from '../transformers/template';


export const TaggedTemplateExpression = (node, module, c) => {
    base.TaggedTemplateExpression(node, module, c);

    if (node.tag.name !== module.tag) return;
    const { html, binders } = parseTemplate(node.quasi);
    const index = module.addFragment(html);

    binders.forEach(b => {
        b.matchObservables(module.scope);
        b.moduleIndex = module.addBinder(b);
    });
    
    const newAst = templateAFE({ binders, index });
    TTEtoAFE(node, newAst);
};

export const Program = (node, module, c) => {
    base.Program(node, module, c);
    module.addDeclarations(node.body);
};

export const ImportDeclaration = ({ source, specifiers }, { name, imports }) => {
    if(!source.value.endsWith(name)) return;
    imports.specifiers = specifiers;
};