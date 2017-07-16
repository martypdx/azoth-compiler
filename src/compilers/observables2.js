import { base } from 'acorn/dist/walk.es';
import { identifier } from '../transformers/common';

function recursiveReplace(node, state, funcs) {
    const visitor = Object.assign({}, base, funcs);
    const c = (node, state) => visitor[node.type](node, state, c);
    return c(node, state);
}

export function observables({ getRef, sigil='$' } = {}) {
    const newRef = () => identifier(getRef());

    return function observablesWalker(ast, state) {

        return recursiveReplace(ast, state, {
            AssignmentPattern(node, state, c) {
                const { left, right } = node;
                
                if(right.name !== sigil) {
                    return base.AssignmentPattern(node, state, c);
                }

                if(left.type === 'Identifier') {
                    state.observables.push(left.name);
                    return left;
                }
                
                if(left.type === 'ObjectPattern' || left.type === 'ArrayPattern') {
                    const ref = newRef();
                    state.destructured.push({ ref, node: left });
                    return ref;
                }
            },

            ObjectPattern(node, state, c) {
                node.properties.forEach(p => p.value = c(p.value, state));
                return node;
            },

            ArrayPattern(node, state, c) {
                node.elements = node.elements.map(el => c(el, state));
                return node;
            }
            
        }) || ast;
    };
}
