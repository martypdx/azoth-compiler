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
    SUB, 
    RENDER,
    RENDERER_IMPORT, 
    MAKE_FRAGMENT_IMPORT } from './identifiers';
import { VALUE } from '../binders/binding-types';

// const __render${index} = __renderer(__makeTemplate(`${html}`));
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

// return __fragment;
const RETURN_FRAGMENT = returnStatement({ arg: identifier(FRAGMENT) });

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
    if(!unsubs.length) return [RETURN_FRAGMENT];
    return [
        fragmentUnsubscribe(unsubs),
        RETURN_FRAGMENT
    ];
};
