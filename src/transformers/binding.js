import { VALUE, SUBSCRIBE } from '../binders/binding-types';
import { declareConst, callExpression, memberExpression, identifier } from './common';
import { BINDER, NODES, SUB } from './identifiers';

// __bind${moduleIndex}(__nodes[${elementIndex}])
function nodeBinding(moduleIndex, elementIndex) {
    return callExpression({
        callee: identifier(`${BINDER}${moduleIndex}`), 
        args: [memberExpression({
            name: NODES, 
            property: {
                type: 'Literal',
                value: elementIndex,
                raw: `${elementIndex}`
            }, 
            computed: true
        })]
    });
}

// <nodeBinding>(<ast>);
const valueBinding = binder => {
    const { ast, moduleIndex, elIndex } = binder;

    return {
        type: 'ExpressionStatement',
        expression: callExpression({
            callee: nodeBinding(moduleIndex, elIndex),
            args: [ast]
        })
    };
};

// const __sub${binderIndex} = <ast>.subscribe(<nodeBinding>);
const subscribeBinding = (binder, binderIndex) => {
    const { ast, moduleIndex, elIndex } = binder;

    return declareConst({
        name: `${SUB}${binderIndex}`, 
        init: callExpression({
            callee: memberExpression({ 
                object: ast, 
                property: identifier('subscribe')
            }),
            args: [nodeBinding(moduleIndex, elIndex)]
        }) 
    });
};

export default (binder, i) => {
    switch(binder.type) {
        case VALUE:
            return valueBinding(binder, i);
        case SUBSCRIBE:
            return subscribeBinding(binder, i);
        default:
            throw new Error(`Unsupported binding type ${binder.type}`);
    }
};
