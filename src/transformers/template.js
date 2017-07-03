import { 
    arrowFunctionExpression,
    callExpression, 
    declareConst, 
    identifier } from './common';
import fragment from './fragment';
import binding from './binding';
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

export const templateAFE = ({ binders, index }) => {
    const bindings = binders.map(binding);
    const statements = [
        renderNodes(index),
        ...bindings,
        ...fragment(binders)
    ];
    return arrowFunctionExpression({ block: statements });
};

export const TTEtoAFE = (node, AFE) => {
    node.type = 'CallExpression',
    node.callee = AFE;
};
