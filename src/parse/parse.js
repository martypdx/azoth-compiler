import findTemplates from './find-templates';
import { findParams } from './params';
import parseTemplate from './parse-template';
import matchObservables from './match-observables';

export default function parse(ast, { tag, identifiers: parentIdentifiers } = {}) {

    return findTemplates(ast, { tag }).map(({ node, ancestors }, index) => {

        const { html, binders } = parseTemplate(node.quasi);
        replaceTemplateWithIdentifier(node, index);
        
        const { params, identifiers: current } = findParams(ancestors);
        const identifiers = combine(parentIdentifiers, current);

        const recurse = ast => parse(ast, { tag, identifiers });

        binders.forEach(binder => {
            binder.templates = recurse(binder.ast);
            binder.params = matchObservables(binder.ast, identifiers);
        });

        const position = { start: node.start, end: node.end };
        return { html, binders, params, node, position };

    });
}

function combine(parent, child) {
    if (parent === undefined) return new Set(child);
    return new Set([...parent, ...child]);
}

function replaceTemplateWithIdentifier(node, index) {
    node.type = 'Identifier',
    node.name = `__t${index}`;
    delete node.tag;
    delete node.quasi;
    delete node.start;
    delete node.end;
}