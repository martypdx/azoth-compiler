import { base as defaultBase } from 'acorn/dist/walk.es';
import { identifier } from '../transformers/common';

function recursive(node, state, funcs, base = defaultBase, override) {
    const visitor = funcs ? Object.assign({}, base, funcs) : base;

    function c(node, st, override) {
        return visitor[override || node.type](node, st, c);
    }

    return c(node, state, override);
}

const IDENTIFIER = '$';

export function observables(ast, state) {
    
    return recursive(ast, state, {
        AssignmentPattern(node, state) {
            const { left, right } = node;
            
            if(right.name !== IDENTIFIER) {
                return; // defaultBase.AssignmentPattern(node, state, c);
            }

            if(left.type === 'Identifier') {
                state.observables.push(left.name);
                return left;
            }
            else if(left.type === 'ObjectPattern' || left.type === 'ArrayPattern') {
                state.destructure = left;
                return identifier(state.getRef());
            }
        },
        Pattern(node, st, c) {
            if (node.type == 'Identifier')
                return (node, st, 'VariablePattern');
            else if (node.type == 'MemberExpression')
                return c(node, st, 'MemberPattern');
            else
                return c(node, st);
        },
        ObjectPattern(node, st, c) {
            node.properties.forEach(prop => {
                prop.value = c(prop.value, st, 'Pattern');
            });
            return node;
        },
        ArrayPattern(node, st, c) {
            node.elements = node.elements.map(el => {
                return c(el, st, 'Pattern');
            });
            return node;
        }
        
    }) || ast;
}
