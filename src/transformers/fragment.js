import { 
    arrowFunctionExpression,
    callExpression,
    declareConst, 
    identifier,
    literal, 
    memberExpression,
    returnStatement } from './common';

import { 
    FRAGMENT, 
    NODES, 
    SUB, 
    RENDER,
    RENDERER_IMPORT, 
    MAKE_FRAGMENT_IMPORT } from './identifiers';
import { VALUE } from '../binders/binding-types';

// const __render${index} = __renderer(__makeFragment(`${html}`));
export const renderer = (html, index) =>{
    
    const makeFragment = callExpression({
        name: MAKE_FRAGMENT_IMPORT,
        args: [literal({
            value: html,
            raw: `\`${html}\``
        })]
    });

    return declareConst({ 
        name: `${RENDER}${index}`, 
        init: callExpression({ 
            name: RENDERER_IMPORT,
            args: [ makeFragment ]
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
const DECLARE_FRAGMENT = declareConst({ name: FRAGMENT, init: LAST_NODE });  

// return __fragment;
const RETURN_FRAGMENT = returnStatement({ arg: identifier(FRAGMENT) });

// return __nodes[__nodes.length - 1];
const DIRECT_RETURN = returnStatement({ arg: LAST_NODE });

// __sub${index}${suffix}.unsubscribe();
const unsubscribe = (index, suffix = '') => {
    const callee = memberExpression({
        name: `${SUB}${index}${suffix}`, 
        property: identifier('unsubscribe')
    });

    return {
        type: 'ExpressionStatement',
        expression: callExpression({ callee })
    };
};

const unsubscribes = binders => {
    const unsubs = [];
    binders.forEach((binder, i) => {
        const { type, target } = binder;
        if(type !== VALUE) unsubs.push(unsubscribe(i));
        if(target.isBlock) unsubs.push(unsubscribe(i, 'b')); 
    });
    return unsubs;
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
