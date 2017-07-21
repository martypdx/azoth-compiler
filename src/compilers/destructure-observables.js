import { recursive, base } from 'acorn/dist/walk.es';
import { 
    callMethod,
    declareConst, 
    identifier,
    literal } from '../transformers/common';

const property = identifier('child');
const initChild = ({ ref: object, arg }) => callMethod({ object, property, arg });

export default function destructureObservables({ newRef, sigil='$' }) {

    return function destructure(node, ref) {
        const observables = [];
        const statements = [];

        const addStatement = ({ node: id, init }) => {
            statements.push(declareConst({ id, init })); 
        };

        const makeRef = init => {
            const ref = newRef();
            addStatement({ node: ref, init });
            return ref;
        };

        recursive(node, { ref }, {
            Property({ computed, key, value }, { ref }, c) {
                const arg = computed ? key : literal({ value: key.name });
                c(value, { ref, arg }, 'Child');
            },

            Child(node, { ref, arg }, c) {
                const init = initChild({ ref, arg });
                c(node, { ref, init });
            },

            Identifier(node, { init }) {
                addStatement({ node, init });
                observables.push(node.name);
            },

            ObjectPattern(node, { ref, init }, c) {
                if(init) ref = makeRef(init);
                node.properties.forEach(p => c(p, { ref }));
            },

            ArrayPattern(node, { ref, init }, c) {
                if(init) ref = makeRef(init);
                node.elements.forEach((el, i) => {
                    if(!el) return;
                    const arg = literal({ value: i, raw: i });
                    c(el, { ref, arg }, 'Child');
                });
            },

            AssignmentPattern(node, state, c) {
                if(node.right.name === sigil) {
                    throw new Error(`Cannot "${ sigil }" twice in same destructuring path`);
                }
                base.AssignmentPattern(node, state, c);
            }        
        });

        return { statements, observables };
    };
}
