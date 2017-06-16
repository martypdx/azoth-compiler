import { 
    arrowFunctionExpression,
    callExpression,
    declareConst, 
    identifier, 
    memberExpression } from './common';
import { FRAGMENT, NODES, SUB } from './identifiers';

// __nodes.length
const NODES_LENGTH = memberExpression({
    name: NODES, 
    property: identifier('length')
});

// __nodes[<NODES_LENGTH> - 1]
const LAST_NODE = memberExpression({
    name: NODES, 
    property: {
        type: 'BinaryExpression',
        left: NODES_LENGTH,
        operator: '-',
        right: {
            type: 'Literal',
            value: 1,
            raw: '1'
        }
    },
    computed: true
}); 

// const __fragment = __nodes[__nodes.length - 1];
const DECLARE_FRAGMENT = declareConst({
    name: FRAGMENT, 
    init: LAST_NODE
});  

// return __fragment;
const RETURN_FRAGMENT = {
    type: 'ReturnStatement',
    argument: identifier(FRAGMENT)
};

// return __nodes[__nodes.length - 1];
const DIRECT_RETURN = {
    type: 'ReturnStatement',
    argument: LAST_NODE
};

// __sub${index}.unsubscribe();
const unsubscribe = index => {
    const callee = memberExpression({
        name: `${SUB}${index}`, 
        property: identifier('unsubscribe')
    });

    return {
        type: 'ExpressionStatement',
        expression: callExpression({ callee })
    };
};

const unsubscribes = binders => {
    return binders
        // map first because we need to 
        // preserve original index as subscriber 
        // index, i.e. __sub0
        .map((binder, i) => {
            if (!binder.isSubscriber) return;
            return unsubscribe(i);
        })
        .filter(unsub => unsub);
};


// __fragment.unsubscribe = () => {
//     ${unsubscribes}
// };
const fragmentUnsubscribe = unsubscribes => {
    return   {
        type: 'ExpressionStatement',
        expression: {
            type: 'AssignmentExpression',
            operator: '=',
            left: memberExpression({
                name: FRAGMENT,
                property: identifier('unsubscribe')
            }),
            right: arrowFunctionExpression(unsubscribes)
        }
    };
};

export default binders => {
    const unsubs = unsubscribes(binders);
    if(!unsubs.length) return [DIRECT_RETURN];
    return [
        DECLARE_FRAGMENT,
        fragmentUnsubscribe(unsubs),
        RETURN_FRAGMENT
    ];
};
