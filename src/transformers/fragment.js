import { 
    arrowFunctionExpression,
    callExpression,
    declareConst, 
    identifier,
    literal, 
    memberExpression } from './common';
import { 
    FRAGMENT, 
    NODES, 
    SUB, 
    RENDER,
    RENDERER_IMPORT, 
    MAKE_FRAGMENT_IMPORT } from './identifiers';


export const renderer = (html, index) =>{
    return declareConst({ 
        name: `${RENDER}${index}`, 
        init: callExpression({ 
            name: RENDERER_IMPORT,
            args: [
                callExpression({
                    name: MAKE_FRAGMENT_IMPORT,
                    args: [literal({
                        value: html,
                        raw: `\`${html}\``
                    })]
                })
            ]
        })
    });  
};

// __nodes.length
const NODES_LENGTH = memberExpression({
    name: NODES, 
    property: identifier('length')
});

// NOTE: because we add fragment to NodeList manually,
// length is actually off by one. hence NOT [<NODES_LENGTH> - 1]
// __nodes[<NODES_LENGTH>]
const LAST_NODE = memberExpression({
    name: NODES, 
    property: NODES_LENGTH,
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
            right: arrowFunctionExpression({ block: unsubscribes })
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
