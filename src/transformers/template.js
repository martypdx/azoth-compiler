import { declareConst, identifier, callExpression } from './common';
import fragment from './fragment';
import binding from './binding';
import { NODES } from './identifiers';

const RENDER = '__render';

// const __nodes = __render${index}();
const renderNodes = index => {
    return declareConst({ 
        name: NODES, 
        init: callExpression({ 
            callee: identifier(`${RENDER}${index}`)
        })
    });
};

// (() => {}())
const iife = body => ({
    type: 'ArrowFunctionExpression',
    id: null,
    generator: false,
    expression: false,
    params: [],
    body: {
        type: 'BlockStatement',
        body
    }
});

export default ({ binders, index }) => {
    const bindings = binders.map(binding);
    const statements = [
        renderNodes(index),
        ...bindings,
        ...fragment(binders)
    ];
    return iife(statements);
};

export function TTEtoAFE(node, AFE) {
    node.type = 'CallExpression',
    node.callee = AFE;
}
