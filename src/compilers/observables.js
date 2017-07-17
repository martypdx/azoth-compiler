import { base } from 'acorn/dist/walk.es';
import { addStatementsToFunction, identifier } from '../transformers/common';
import makeObservablesFrom from './observables-from';

function setScope({ declaration, scope, functionScope }, key) {
    scope[key] = true;
    if(declaration === 'var' && functionScope !== scope) {
        functionScope[key] = true; 
    }
}

export default function createHandlers({ getRef, sigil='$' }) {
    const newRef = () => identifier(getRef());
    const observablesFrom = makeObservablesFrom({ newRef, sigil });

    return {
        Observable(node, { scope, functionScope, declaration }) {
            const addTo = declaration === 'var' ? functionScope : scope;
            return addTo[node.left.name] = true;
        },

        // modification of acorn's "Function" base visitor.
        // https://github.com/ternjs/acorn/blob/master/src/walk/index.js#L262-L267
        Function(node, state, c) {
            const { scope, functionScope } = state;
            const newScope = state.scope = state.functionScope = Object.create(scope);

            const statements = [];
            const options = {
                addObservable: o => newScope[o] = true,
                addStatements: s => statements.push(...s) 
            };

            node.params = node.params.map(node => {
                const newNode = observablesFrom(node, options);
                // process any scope changes
                // TODO: figure this out. works for nested but ruins siblings
                // c(node, state, 'Pattern');
                return newNode;
            });
            
            if(statements.length) {
                // this call may mutate the function by creating a
                // BlockStatement in lieu of AFE implicit return
                addStatementsToFunction({ fn: node, statements, returnBody: true });
            }
            
            const priorFn = state.fn;
            state.fn = node;

            c(node.body, state, node.expression ? 'ScopeExpression' : 'ScopeBody');
            
            state.fn = priorFn;
            state.scope = scope;
            state.functionScope = functionScope;
        },

        BlockStatement(node, state, c) {
            const { scope } = state;
            state.scope = Object.create(scope);
            state.__block = node.body;
            base.BlockStatement(node, state, c);
            state.scope = scope;
        },

        VariableDeclaration(node, state, c) {
            state.declaration = node.kind;
            base.VariableDeclaration(node, state, c);
            state.declaration = null;
        },

        VariableDeclarator(node, state, c) {

            const statements = [];
            const options = {
                addObservable: o => setScope(state, o),
                addStatements: s => statements.push(...s) 
            };

            node.id = observablesFrom(node.id, options);

            if(statements.length) {
                console.log(statements);
            }

            c(node.init, state);
        },

        VariablePattern({ name }, { scope }) {
            if(scope[name]) scope[name] = false;
        }
    };
}
