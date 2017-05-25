import findTemplates from './find-templates';
import getParams from './get-params';
import parseTemplate from './parse-template';

export default function parse(ast, { tag, parentIdentifiers } = {}) {

    return findTemplates(ast, { tag }).map(({ node, ancestors }, index) => {
        
        const { html, binders } = parseTemplate(node.quasi);
        replaceTemplateWithIdentifier(node, index);
        
        const { params, identifiers: current } = getParams(ancestors);
        const identifiers = combine(parentIdentifiers, current);
        const recurse = ast => parse(ast, { tag, identifiers });

        binders.forEach(b => b.calculate({ identifiers, recurse }));

        const position = { start: node.start, end: node.end };
        return { html, binders, params, node, position };

    });
}

function combine(parent, child) {
    if (parent === undefined) return new Set(child);
    return new Set([...parent].concat(child));
}

function replaceTemplateWithIdentifier(node, index) {
    node.type = 'Identifier',
    node.name = `__t${index}`;
    delete node.tag;
    delete node.quasi;
    delete node.start;
    delete node.end;
}