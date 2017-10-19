import { 
    arrowFunctionExpression,
    callExpression, 
    declareConst, 
    identifier,
    memberExpression,
    property,
    returnStatement } from './common';
import fragment from './fragment';
import { binding, childNode, nodeInits } from './binding';
import { NODES, RENDER, FRAGMENT } from './identifiers';

// const <RENDERED> = __render${index}();
const renderNodes = index => {
    return declareConst({ 
        id: RENDERED, 
        init: render(index)
    });
};

const render = index => callExpression({ 
    callee: identifier(`${RENDER}${index}`)
});

// { __fragment, __nodes }
const RENDERED = {
    type: 'ObjectPattern',
    properties: [
        property({ key: identifier(FRAGMENT) }), 
        property({ key: identifier(NODES) })
    ]
};

export const blockToFunction = (block, node = {}) => {
    const ast = arrowFunctionExpression({ block });
    Object.assign(node, ast);
    return node;
};

const noBinders = index => returnStatement({ 
    arg: memberExpression({
        object: render(index),
        property: identifier(FRAGMENT) 
    }) 
});

export const makeTemplateStatements = ({ binders, index }) => {
    if(binders.length === 0) return [noBinders(index)];

    const childNodes = binders
        .map((b, i) => childNode(b, i))
        .filter(c => c);

    const bindings = binders
        // binding takes additional params, so we can't directly pass to map
        .map((b, i) => binding(b, i))
        .filter(b => b)
        .reduce((a, b) => a.concat(b), []);

    const oninits = binders
        // binding takes additional params, so we can't directly pass to map
        .map((b, i) => nodeInits(b, i))
        .filter(b => b)
        .reduce((a, b) => a.concat(b), []);
        
    return [
        renderNodes(index),
        ...childNodes,
        ...bindings,
        ...oninits,
        ...fragment(binders)
    ];
};