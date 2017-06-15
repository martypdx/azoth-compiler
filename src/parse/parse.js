import findTemplates from './find-templates';
import { findParams } from './params';
import parseTemplate from './parse-template';
import matchObservables from './match-observables';

export default function parse(ast, { tag, index = 0 /*, identifiers: parentIdentifiers*/ } = {}) {
    
    return findTemplates(ast, { tag }).map((node, templateIndex) => {

        const position = { start: node.start, end: node.end };
        const { html, binders } = parseTemplate(node.quasi);
        replaceTemplateWithIdentifier(node, index, templateIndex);
        
        // const { params, identifiers: current } = findParams(ancestors);
        // const identifiers = combine(parentIdentifiers, current);

        const recurse = (ast, index) => parse(ast, { tag, /* identifiers,*/ index });

        binders.forEach((binder, i) => {
            binder.templates = recurse(binder.ast, i);
            // binder.params = matchObservables(binder.ast, identifiers);
        });

        return { html, binders/*, params*/, position, node };

    });
}

// function combine(parent, child) {
//     if (parent === undefined) return new Set(child);
//     return new Set([...parent, ...child]);
// }

function replaceTemplateWithIdentifier(node, binderIndex, templateIndex) {
    node.type = 'Identifier',
    node.name = `__t${binderIndex}_${templateIndex}`;
    delete node.tag;
    delete node.quasi;
    delete node.start;
    delete node.end;
}