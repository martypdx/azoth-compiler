import { 
    arrayExpression,
    arrowFunctionExpression,
    callExpression, 
    declareConst, 
    identifier,
    literal, 
    memberExpression } from './common';
import { COMBINE, COMBINE_FIRST, FIRST, MAP, MAP_FIRST, SUBSCRIBE, VALUE } from '../binders/binding-types';
import { BINDER, NODES, SUB, FIRST_IMPORT, MAP_IMPORT, COMBINE_IMPORT } from './identifiers';

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

const bindings = {
    [COMBINE]: combineBinding,
    [COMBINE_FIRST]: combineFirstBinding,
    [FIRST]: firstBinding,
    [MAP]: mapBinding,
    [MAP_FIRST]: mapFirstBinding,
    [SUBSCRIBE]: subscribeBinding,
    [VALUE]: valueBinding,
};

export default function binding(binder, i) {
    const binding = bindings[binder.type];
    const statements = [];
    let observer = nodeBinding(binder);

    if(binder.target.isBlock) {
        const id = identifier(`${SUB}${i}b`);
        // const __sub${i}b = <nodeBinding>;
        const declare = declareConst({ id, init: observer });
        statements.push(declare);

        observer = memberExpression({
            object: id,
            property: identifier('observer')
        });
    }

    statements.push(binding(observer, binder, i));
    return statements;
}

// __bind${moduleIndex}(__nodes[${elIndex}])
function nodeBinding({ moduleIndex, elIndex }) {
    return callExpression({
        callee: identifier(`${BINDER}${moduleIndex}`), 
        args: [memberExpression({
            name: NODES, 
            property: literal({ value: elIndex }), 
            computed: true
        })]
    });
}

// <nodeBinding>(<ast>);
function valueBinding(nodeBinding, binder) {
    const { ast } = binder;

    return {
        type: 'ExpressionStatement',
        expression: callExpression({
            callee: nodeBinding,
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
function subscribeBinding(nodeBinding, binder, index) {
    const { ast } = binder;

    return subscription(
        index, 
        callExpression({
            callee: memberExpression({ 
                object: ast, 
                property: identifier('subscribe')
            }),
            args: [nodeBinding]
        }) 
    );
}

// const __sub${binderIndex} = __first(observable, <nodeBinding>);
function firstBinding(nodeBinding, binder, binderIndex) {
    const { observables: [ name ] } = binder;
    const observable = identifier(name);
    const args = [
        observable, 
        nodeBinding
    ];

    return subscription(
        binderIndex, 
        callExpression({
            name: FIRST_IMPORT,
            args
        }) 
    );
}

function addOnce(args) {
    args.push(literal({ value: true }));
}

function mapFirstBinding(nodeBinding, binder, binderIndex) {
    return mapBinding(nodeBinding, binder, binderIndex, true);
}

// const __sub${binderIndex} = __map(observable, observable => (<ast>), <nodeBinding> [, true]);
function mapBinding(nodeBinding, binder, binderIndex, firstValue = false) {
    const { ast, observables: [ name ] } = binder;
    const observable = identifier(name);
    const args = [
        observable, 
        arrowFunctionExpression({ 
            body: ast,
            params: [observable]
        }),
        nodeBinding
    ];
    if(firstValue) addOnce(args);

    return subscription(
        binderIndex, 
        callExpression({
            name: MAP_IMPORT,
            args
        }) 
    );
}

function combineFirstBinding(nodeBinding, binder, binderIndex) {
    return combineBinding(nodeBinding, binder, binderIndex, true);
}

// const __sub${binderIndex} = __combine([o1, o2, o3], (o1, o2, o3) => (<ast>), <nodeBinding> [, true]);
function combineBinding(nodeBinding, binder, binderIndex, firstValue = false) {
    const { ast, observables } = binder;
    const params = observables.map(identifier);
    const args =  [
        arrayExpression({ elements: params }), 
        arrowFunctionExpression({ 
            body: ast,
            params
        }),
        nodeBinding
    ];
    if(firstValue) addOnce(args);

    return subscription(
        binderIndex, 
        callExpression({
            name: COMBINE_IMPORT,
            args
        }) 
    );
}
