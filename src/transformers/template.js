import { 
    arrowFunctionExpression,
    callExpression, 
    declareConst, 
    identifier } from './common';
import fragment from './fragment';
import binding, { childNode } from './binding';
import { NODES, RENDER } from './identifiers';

// const __nodes = __render${index}();
const renderNodes = index => {
    return declareConst({ 
        name: NODES, 
        init: callExpression({ 
            callee: identifier(`${RENDER}${index}`)
        })
    });
};

export const templateToFunction = (node, block) => {
    const ast = arrowFunctionExpression({ block });
    Object.assign(node, ast);
};

export const makeTemplateStatements = ({ binders, index }) => {
    const childNodes = binders
        .map((b, i) => childNode(b, i))
        .filter(c => c);

    const bindings = binders
        // binding takes additional params, so we can't directly pass to map
        .map((b, i) => binding(b, i))
        .reduce((a, b) => a.concat(b), []);
        
    return [
        renderNodes(index),
        ...childNodes,
        ...bindings,
        ...fragment(binders)
    ];
};