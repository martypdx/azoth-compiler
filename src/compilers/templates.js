import { base } from 'acorn/dist/walk.es';

export const TaggedTemplateExpression = (node, module, c) => {
    base.TaggedTemplateExpression(node, module, c);
    debugger;
    if (node.tag.name !== module.templateTag) return;
    module.makeTemplate(node);
};

export const Program = (node, module, c) => {
    module.currentFn = node;
    c(node, module, 'BlockStatement');
    module.addDeclarations(node.body);
};

export const ImportDeclaration = ({ source, specifiers }, { name, imports }) => {
    if(!source.value.endsWith(name)) return;
    imports.specifiers = specifiers;
};

export const ReturnStatement = (node, module, c) => {
    const prior = module.currentReturnStmt;
    module.currentReturnStmt = node;
    base.ReturnStatement(node, module, c);
    module.currentReturnStmt = prior;
};