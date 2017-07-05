import { 
    arrayExpression,
    arrowFunctionExpression,
    callExpression, 
    declareConst, 
    identifier,
    literal, 
    memberExpression } from './common';
import { MAP, SUBSCRIBE, VALUE } from '../binders/binding-types';
import { BINDER, NODES, SUB, FIRST_OPERATOR, MAP_OPERATOR, COMBINE_OPERATOR } from './identifiers';

export function initBinder({ name, arg, index }) {
    return declareConst({
        name: `${BINDER}${index}`,
        init: callExpression({
            name,
            args: [
                literal({ value: arg })
            ]
        })
    });
}

export default function binding(binder, i) {
    const { type, ast, observables } = binder;
    const isIdentifier = ast.type === 'Identifier';
    const observablesCount = observables.length;

    const binding = getBinding(type, isIdentifier, observablesCount);
    return binding(binder, i);
}

function getBinding(type, isIdentifier, observablesCount) {
    if(!observablesCount) return valueBinding;
    if(type === SUBSCRIBE) return subscribeBinding;
    if(isIdentifier) return type === MAP ? subscribeBinding : firstBinding;
    if(observablesCount === 1) return mapBinding;
    return combineBinding;
}

// __bind${moduleIndex}(__nodes[${elementIndex}])
function nodeBinding(moduleIndex, elementIndex) {
    return callExpression({
        callee: identifier(`${BINDER}${moduleIndex}`), 
        args: [memberExpression({
            name: NODES, 
            property: literal({ value: elementIndex }), 
            computed: true
        })]
    });
}

// <nodeBinding>(<ast>);
function valueBinding(binder) {
    const { ast, moduleIndex, elIndex } = binder;

    return {
        type: 'ExpressionStatement',
        expression: callExpression({
            callee: nodeBinding(moduleIndex, elIndex),
            args: [ast]
        })
    };
}

// const __sub${index} = <init>
function subscription(index, init) {
    return declareConst({
        name: `${SUB}${index}`, 
        init
    });
}

// const __sub${binderIndex} = (<ast>).subscribe(<nodeBinding>);
function subscribeBinding(binder, index) {
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
}

// const __sub${binderIndex} = __first(observable, <nodeBinding>);
function firstBinding(binder, binderIndex) {
    const { moduleIndex, elIndex, observables: [ name ] } = binder;
    const observable = identifier(name);
    const args = [
        observable, 
        nodeBinding(moduleIndex, elIndex)
    ];

    return subscription(
        binderIndex, 
        callExpression({
            name: FIRST_OPERATOR,
            args
        }) 
    );
}

function addOnceFlagIfValue(type, args) {
    if(type === VALUE) args.push(literal({ value: true }));
}

// const __sub${binderIndex} = __map(observable, observable => (<ast>), <nodeBinding> [, true]);
function mapBinding(binder, binderIndex) {
    const { ast, type, moduleIndex, elIndex, observables: [ name ] } = binder;
    const observable = identifier(name);
    const args = [
        observable, 
        arrowFunctionExpression({ 
            body: ast,
            params: [observable]
        }),
        nodeBinding(moduleIndex, elIndex)
    ];
    addOnceFlagIfValue(type, args);

    return subscription(
        binderIndex, 
        callExpression({
            name: MAP_OPERATOR,
            args
        }) 
    );
}


// const __sub${binderIndex} = __combine([o1, o2, o3], (o1, o2, o3) => (<ast>), <nodeBinding> [, true]);
function combineBinding(binder, binderIndex) {
    const { ast, type, moduleIndex, elIndex, observables } = binder;
    const params = observables.map(identifier);
    const args =  [
        arrayExpression({ elements: params }), 
        arrowFunctionExpression({ 
            body: ast,
            params
        }),
        nodeBinding(moduleIndex, elIndex)
    ];
    addOnceFlagIfValue(type, args);

    return subscription(
        binderIndex, 
        callExpression({
            name: COMBINE_OPERATOR,
            args
        }) 
    );
}
