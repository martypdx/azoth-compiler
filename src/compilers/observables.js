import { base } from 'acorn/dist/walk.es';
import makeObservablesFrom from './observables-from';

function setScope({ declaration, scope, functionScope }, key) {
    scope[key] = true;
    if(declaration === 'var' && functionScope !== scope) {
        functionScope[key] = true; 
    }
}

function clearScope({ declaration, scope, functionScope }, key) {
    if(!scope[key]) return;
    scope[key] = false;
    if(declaration === 'var' && functionScope !== scope) {
        functionScope[key] = false; 
    }
}

function getOptions(state) {
    const _statements = [];
    return {
        addObservable: o => setScope(state, o),
        addStatements: s => _statements.push(...s),
        addIdentifier: i => clearScope(state, i),
        get statements() { return _statements; }
    };
}

export default function createHandlers(newRef, sigil='$') {
    
    const observablesFrom = makeObservablesFrom({ newRef, sigil });

    return {
        Observable(node, { scope, functionScope, declaration }) {
            const addTo = declaration === 'var' ? functionScope : scope;
            return addTo[node.left.name] = true;
        },

        Function(node, state, c) {
            const { scope, functionScope } = state;
            state.scope = state.functionScope = Object.create(scope);

            const options = getOptions(state);

            node.params = node.params.map(node => observablesFrom(node, options));
            
            const priorFn = state.currentFn;
            state.currentFn = node;

            c(node.body, state, node.expression ? 'ScopeExpression' : 'ScopeBody');
            
            state.currentFn = priorFn;
            state.scope = scope;

            // need to wait to add statements, otherwise they will get picked up
            // in c(node.body, ...) call above (which causes the identifiers to 
            // "unregister" the observables)
            const { statements } = options;
            if(statements.length) {
                // this call may mutate the function by creating a
                // BlockStatement in lieu of AFE implicit return
                state.addStatements(statements);
                state.flushStatements(node, { returnBody: true });
            }

            state.functionScope = functionScope;
        },

        BlockStatement(node, state, c) {
            const { scope } = state;
            state.scope = Object.create(scope);
            node.body.slice().forEach((statement, i) => {
                const oldIndex = state.index;
                state.index = i;
                c(statement, state, 'Statement');
                state.index = oldIndex;
            });
            state.flushStatements(node);
            state.scope = scope;
        },

        VariableDeclaration(node, state, c) {
            state.declaration = node.kind;
            base.VariableDeclaration(node, state, c);
            state.declaration = null;
        },

        VariableDeclarator(node, state, c) {

            const options = getOptions(state);
            node.id = observablesFrom(node.id, options);

            const { statements } = options;
            if(statements.length) {
                const index = state.index !== -1 ? state.index + 1 : 0;
                // this call may mutate the function by creating a
                // BlockStatement in lieu of AFE implicit return
                state.addStatements(statements, index);
            }

            if(node.init) c(node.init, state);
        },

        VariablePattern({ name }, state) {
            clearScope(state, name);
        }
    };
}
