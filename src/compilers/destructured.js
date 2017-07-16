import { recursive, base } from 'acorn/dist/walk.es';
import { 
    callMethod,
    declareConst, 
    identifier,
    literal } from '../transformers/common';

const property = identifier('child');
const initChild = ({ ref: object, arg }) => callMethod({ object, property, arg });

export function toStatements(ref, node, getRef, sigil='$') {
    const statements = [];
    const newRef = () => identifier(getRef());

    recursive(node, { ref }, {
        Property({ computed, key, value }, { ref }, c) {
            const arg = computed ? key : literal({ value: key.name });
            const init = initChild({ ref, arg });
            c(value, { ref, init });
        },
        Identifier(node, { init }) {
            statements.push(declareConst({ id: node, init }));
        },
        Ref(init) {
            const ref = newRef();
            this.Identifier(ref, { init });
            return ref;
        },
        ObjectPattern(node, { ref, init }, c) {
            if(init) ref = this.Ref(init);
            for(let prop of node.properties) c(prop, { ref });
        },
        ArrayPattern(node, { ref, init }, c) {
            if(init) ref = this.Ref(init);
            node.elements.forEach((el, i) => {
                if(!el) return;
                const arg = literal({ value: i, raw: i });
                const init = initChild({ ref, arg });
                c(el, { ref, init });
            });
        },
        AssignmentPattern(node, state, c) {
            if(node.right.name === sigil) {
                throw new Error('Cannot assign $ as second time');
            }
            base.AssignmentPattern(node, state, c);
        }        
    });

    return statements;
}
