import { recursive } from 'acorn/dist/walk.es';
import { 
    callExpression,
    declareConst, 
    identifier,
    literal,
    memberExpression } from '../transformers/common';

export function toStatements(ref, node, getRef) {
    const statements = [];

    recursive(node, { statements, ref }, {
        
        ObjectPattern(node, state, c) {
            node.properties.forEach(({ key, value, computed }) => {
                const isIdentifier = value.type === 'Identifier';
                const id = isIdentifier ? value : identifier(getRef());
                statements.push(
                    destructure({
                        id,
                        ref: state.ref,
                        arg: computed ? key : literal({ value: key.name })
                    })
                );
                if(!isIdentifier) {
                    const oldRef = state.ref;
                    state.ref = id;
                    c(value, state);
                    state.ref = oldRef;
                }

            });
            return node;
        },
        ArrayPattern(node, state, c) {
            node.elements.forEach((el, key) => {
                const isIdentifier = el.type === 'Identifier';
                const id = isIdentifier ? el : identifier(getRef());
                statements.push(
                    destructure({
                        id,
                        ref: state.ref,
                        arg: literal({ value: key, raw: key })
                    })
                );
                if(!isIdentifier) {
                    const oldRef = state.ref;
                    state.ref = id;
                    c(el, state);
                    state.ref = oldRef;
                }

            });
            return node;
        }        
    });

    return statements;
}

// const <id> = <ref>.child(<arg>);
function destructure({ id, ref, arg, name }) {
    if(name) arg = literal({ value: arg.name });
    return declareConst({
        id,
        init: callExpression({
            callee: memberExpression({ 
                object: ref, 
                property: identifier('child')
            }),
            args: [arg]
        })
    });
}
