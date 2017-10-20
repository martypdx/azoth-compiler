import destructureObservables from './destructure-observables';

function recursiveReplace(node, state, visitors) {
    function c(node, state){
        const found = visitors[node.type];
        return found ? found(node, state, c) : node;
    }
    return c(node, state);
}

export default function makeObservablesFrom({ newRef, sigil='$' }) {

    const destructure = destructureObservables({ newRef, sigil });

    return function observablesFrom(ast, state) {

        return recursiveReplace(ast, state, {
            AssignmentPattern(node, state, c) {
                const { left, right } = node;
                
                if(right.name !== sigil) {
                    // TODO: could be more to do `left` (templates, expression functions, etc)
                    return {
                        type: 'AssignmentPattern',
                        left: c(left, state),
                        right: c(right, state)
                    };
                }

                if(left.type === 'Identifier') {
                    state.addObservable(left.name);
                    return left;
                }
                
                if(left.type === 'ObjectPattern' || left.type === 'ArrayPattern') {
                    const ref = newRef();
                    const { statements, observables } = destructure(left, ref);
                    state.addStatements(statements);
                    observables.forEach(state.addObservable);
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
            },

            Identifier(node, state) {
                state.addIdentifier(node.name);
                return node;
            }
            
        }) || ast;
    };
}
