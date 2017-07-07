import { recursive, base as defaultBase } from 'acorn/dist/walk.es';
import { 
    addStatementsToFunction,
    blockStatement,
    callExpression,
    declareConst, 
    identifier,
    literal,
    memberExpression,
    returnStatement } from '../transformers/common';

const IDENTIFIER = '$';

export function params(fn, getRef) {
    const identifiers = new Set();
    const statements = [];
    
    const state = {
        key: null,
        ref: null,
        getRef,
        identifiers,
        statements
    };
    
    fn.params = fn.params.map(node => {
        return paramWalk(node, state);
    });

    if(statements.length) {
        addStatementsToFunction({ fn, statements, returnBody: true });
    }
    return [...state.identifiers];
}

//TODO: get variables working
export function variables(declarator, getRef) {
    const { id } = declarator;
    const { type } = id;
    const isObject = type === 'ObjectPattern';
    const isArray = type === 'ArrayPattern';

    if(!(isObject || isArray)) return;

    const identifiers = new Set();
    const statements = [];
    
    const state = {
        key: null,
        ref: null,
        getRef,
        identifiers,
        statements
    };

    paramWalk(declarator.id, state);

    console.log(statements);
}

// const <name> = <ref>.child('<name>');
function destructure({ name, ref, arg }) {
    return declareConst({
        name,
        init: callExpression({
            callee: memberExpression({ 
                object: ref, 
                property: identifier('child')
            }),
            args: [arg]
        })
    });
}

function paramWalk(ast, state) {
    if(ast.type !== 'AssignmentPattern') return ast;

    recursive(ast, state, {
        AssignmentPattern(node, state, c) {
            if(node.right.name !== IDENTIFIER || node !== ast) return;
            ast = node.left;
            defaultBase.Pattern(node.left, state, c);
        },
        Identifier(node, { identifiers }) {
            identifiers.add(node.name);
        },
        VariablePattern({ name }, { key, ref, identifiers, statements }) {
            identifiers.add(name);
            if(!ref) return;
            const statement = destructure({ name, ref, arg: key });
            statements.push(statement);
        },
        ObjectPattern(node, state, c) {
            const { ref: parentRef, getRef, statements } = state;
            const ref = state.ref = identifier(getRef());
            if(!parentRef) ast = ref;
            else {
                const statement = destructure({ 
                    name: ref.name, 
                    ref: parentRef, 
                    arg: state.key
                });
                statements.push(statement);
            }
            
            for (let prop of node.properties) {
                const oldKey = state.key;
                state.key = literal({ value: prop.key.name });
                c(prop.value, state, 'Pattern');
                state.key = oldKey;
            }

            state.ref = parentRef;
        },
        ArrayPattern(node, state, c) {
            const { ref: parentRef, getRef, statements } = state;
            const ref = state.ref = identifier(getRef());
            if(!parentRef) ast = ref;
            else {
                const statement = destructure({ 
                    name: ref.name, 
                    ref: parentRef, 
                    arg: state.key
                });
                statements.push(statement);
            }
            
            node.elements.forEach((element, i) => {
                if(!element) return;
                const oldKey = state.key;
                state.key = literal({ value: i });
                c(element, state, 'Pattern');
                state.key = oldKey;
            });

            state.ref = parentRef;
        }
    });

    return ast;
}
