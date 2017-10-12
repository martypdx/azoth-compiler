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

// const __render${index} = __renderer(__rawHtml(`${html}`));
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

// __nodes[<NODES_LENGTH> - 1]
const LAST_NODE = memberExpression({
    name: NODES, 
    property: {
        type: 'BinaryExpression',
        left: NODES_LENGTH,
        operator: '-',
        right: literal({ value: 1 })
    },
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

const unsubscribes = (binders, prefix = '') => {
    const unsubs = [];
    binders.forEach((binder, i) => {
        const { type, target } = binder;
        const id = prefix + i;
        if(type && type !== VALUE) unsubs.push(unsubscribe(id));
        if(target.isBlock || target.isComponent) unsubs.push(unsubscribe(id, 'b')); 
        unsubs.push(...unsubscribes(binder.properties, `${id}_`));
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
