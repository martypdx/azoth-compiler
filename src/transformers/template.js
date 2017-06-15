import { declareConst, identifier, callExpression } from './common';
import fragment from './fragment';
import binding from './binding';
import { NODES, RENDER } from './identifiers';

// (() => {}())
const iife = () => ({
    type: 'ArrowFunctionExpression',
    id: null,
    generator: false,
    expression: false,
    params: [],
    body: {
        type: 'BlockStatement',
        body: []
    }
});

const iifeWith = statements => {
    const ast = iife();
    ast.body.body = statements;
    return ast;
};

const render = index => {
    return declareConst({ 
        name: NODES, 
        init: callExpression({ 
            callee: identifier(`${RENDER}${index}`)
        })
    });
};


export default ({ binders, index }) => {
    const bindings = binders.map(binding);
    const statements = [
        render(index),
        ...bindings,
        ...fragment(binders)
    ];
    return iifeWith(statements);
};

export function TTEtoAFE(node, AFE) {
    node.type = 'CallExpression',
    node.callee = AFE;
    delete node.tag;
    delete node.quasi;
    delete node.start;
    delete node.end;
}
