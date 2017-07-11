import { 
    addStatementsToFunction,
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

export const templateToFunction = (node, options) => {
    const statements = templateStatements(options);
    const { fn, returnStatement } = options;
    if(fn) {
        if(fn.body === node) {
            addStatementsToFunction({ fn, statements });
            return;
        }
        if(returnStatement && returnStatement.argument === node) {
            const block = fn.body.body;
            const index = block.findIndex(n => n === returnStatement);
            block.splice(index, 1, ...statements);
            return;
        }
    } 

    const ast = arrowFunctionExpression({ block: statements });
    Object.assign(node, ast);
};

export const templateStatements = ({ binders, index }) => {
    const bindings = binders
        .map(binding)
        .reduce((a, b) => a.concat(b));
        
    return [
        renderNodes(index),
        ...bindings,
        ...fragment(binders)
    ];
};