import { 
    arrayExpression,
    arrowFunctionExpression,
    callExpression, 
    declareConst, 
    identifier, 
    memberExpression } from './common';
import { SUBSCRIBE, VALUE, MAP } from '../binders/binding-types';
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

const subscription = (index, init) => {
    return declareConst({
        name: `${SUB}${index}`, 
        init
    });
};

// const __sub${binderIndex} = (<ast>).subscribe(<nodeBinding>);
const subscribeBinding = (binder, index) => {
    const { ast, moduleIndex, elIndex } = binder;

    return subscription(
        index, 
        callExpression({
            callee: memberExpression({ 
                object: ast, 
                property: identifier('subscribe')
            }),
            args: [nodeBinding(moduleIndex, elIndex)]
        }) 
    );
};

const expressionBinding = (binder, index) => {
    switch(binder.observables.length) {
        case 0:
            return valueBinding(binder, index);
        case 1:
            return mapBinding(binder, index);
        default:
            return combineBinding(binder, index);
    }
};

// const __sub${binderIndex} = __map(observable, observable => (<ast>), <nodeBinding>);
const mapBinding = (binder, binderIndex) => {
    const { ast } = binder;
    if(ast.type === 'Identifier') return subscribeBinding(binder, binderIndex);
    
    const { moduleIndex, elIndex, observables: [ name ] } = binder;
    const observable = identifier(name);
    return subscription(
        binderIndex, 
        callExpression({
            name: '__map',
            args: [
                observable, 
                arrowFunctionExpression({ 
                    body: ast,
                    params: [observable]
                }),
                nodeBinding(moduleIndex, elIndex)
            ]
        }) 
    );
};


// const __sub${binderIndex} = __combine([o1, o2, o3], (o1, o2, o3) => (<ast>), <nodeBinding>);
const combineBinding = (binder, binderIndex) => {
    const { ast, moduleIndex, elIndex, observables } = binder;
    const params = observables.map(identifier);
    return subscription(
        binderIndex, 
        callExpression({
            name: '__combine',
            args: [
                arrayExpression({ elements: params }), 
                arrowFunctionExpression({ 
                    body: ast,
                    params
                }),
                nodeBinding(moduleIndex, elIndex)
            ]
        }) 
    );
};

export default (binder, i) => {
    const { type } = binder;

    switch(type) {
        case VALUE:
            return valueBinding(binder, i);
        case SUBSCRIBE:
            return subscribeBinding(binder, i);
        case MAP:
            return expressionBinding(binder, i);
        default:
            throw new Error(`Unsupported binding type ${type}`);
    }
};

export const initBinder = ({ name, arg, index }) => {
    return declareConst({
        name: `${BINDER}${index}`,
        init: callExpression({
            name,
            args: [{
                type: 'Literal',
                value: arg,
                raw: typeof arg === 'string' ? `"${arg}"` : `${arg}`
            }]
        })
    });
};
