import parseTaggedTemplate from './parseTaggedTemplate';
import { ancestor, base } from 'acorn/dist/walk';

const noNestedTTE = Object.assign(base, { TaggedTemplateExpression(){} });

export default function findTemplates(ast, tag) {
    const templates = [];
    const recurse = ast => findTemplates(ast, tag);

    ancestor(ast, {
        TaggedTemplateExpression(node, ancestors) {
            if(node.tag.name !== tag) return;
            const scope = getFnScope(ancestors);
            const params = scope ? scope.params : null;
            const { html, bindings } = parseTaggedTemplate(node.quasi, params, recurse);
            const index = templates.push({ html, bindings, scope, node }) - 1;
            node.type = 'Identifier',
            node.name = `t${index}`;
            delete node.tag;
            delete node.quasi;
        }
    }, noNestedTTE);
    return templates;
}

const isFn = /function/i;

function getFnScope(ancestors) {
    // current child node is in stack, so -2
    let i = ancestors.length - 2;
    let node = null;
    while(node = ancestors[i--]) {
        if (isFn.test(node.type)) return makeScope(node);
    }
}

function makeScope(scope) {

    const result = {
        params: Object.create(null),
        plucks: [],
        start: scope.start,
        end: scope.end
    };

    scope.params.reduce((hash, param, i) => {
        if (param.type === 'Identifier') hash[ param.name ] = true;
        else if (param.type === 'ObjectPattern') {
            // TODO: add rest of destructuring
            // currently only handles ObjectPattern 1 level deep
            param.properties.forEach(p => {
                const pluck = { key: p.key.name, index: i };
                result.plucks.push(pluck);
                hash[ `__ref${i}` ] = true;
            });
        }
        return hash;
    }, result.params);

    return result;
}

