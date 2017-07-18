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

export const templateToFunction = (node, block) => {
    const ast = arrowFunctionExpression({ block });
    Object.assign(node, ast);
};

export const makeTemplateStatements = ({ binders, index }) => {
    const bindings = binders
        .map(binding)
        .reduce((a, b) => a.concat(b), []);
        
    return [
        renderNodes(index),
        ...bindings,
        ...fragment(binders)
    ];
};