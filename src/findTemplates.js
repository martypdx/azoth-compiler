import parseTaggedTemplate from './parseTaggedTemplate';
import { ancestor, base } from 'acorn/dist/walk';

const noNestedTTE = Object.assign(base, { TaggedTemplateExpression(){} });

export default function findTemplates(ast, tag, parentScope = { params: {} }) {
    const templates = [];

    ancestor(ast, {
        TaggedTemplateExpression(node, ancestors) {
            if (node.tag.name !== tag) return;
            console.log('ANCESTORS', ancestors);
            const scope = getFnScope(ancestors);
            if (scope) scope.params = Object.assign(parentScope.params, scope.params);
            const params = scope ? scope.params : undefined;

            const recurse = ast => findTemplates(ast, tag, scope);
            
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
    // current child node is at end of array, so -2
    let i = ancestors.length - 2;
    let node = null;
    // TODO: I think we need to look for parent scope's function
    // and stop there, because params already accounted for.
    while(node = ancestors[i--]) {
        if (isFn.test(node.type)) return makeScope(node);
    }
}

function makeScope(node) {
    const result = {
        params: Object.create(null),
        plucks: [],
        start: node.start,
        end: node.end
    };

    node.params.reduce((hash, param, i) => {
        if (param.type === 'Identifier') hash[param.name] = true;
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

