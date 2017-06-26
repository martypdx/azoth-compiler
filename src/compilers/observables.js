import { base } from 'acorn/dist/walk.es';
const IDENTIFIER = '$';

export const Observable = (node, { scope, functionScope, declaration }) => {
    if (node.right.name !== IDENTIFIER) return;
    const addTo = declaration === 'var' ? functionScope : scope;
    addTo[node.left.name] = true;
};

    // modification of acorn's Function walk.
    // https://github.com/ternjs/acorn/blob/master/src/walk/index.js#L262-L267
export const Function = (node, state, c) => {
    const { scope, functionScope } = state;
    state.scope = state.functionScope = Object.create(scope);

    for (let param of node.params) {
        if (param.type === 'AssignmentPattern') c(param, state, 'Observable');
        else c(param, state, 'Pattern');
    }

    c(node.body, state, node.expression ? 'ScopeExpression' : 'ScopeBody');

    state.scope = scope;
    state.functionScope = functionScope;
};

export const BlockStatement = (node, state, c) => {
    const { scope } = state;
    state.scope = Object.create(scope);
    base.BlockStatement(node, state, c);
    state.scope = scope;
};

export const VariableDeclarator = ({ id, init }, state, c) => {
    if (id && id.type === 'ObjectPattern') {
        for (let { value } of id.properties) {
            if (value.type === 'AssignmentPattern') c(value, state, 'Observable');
        }
    }
    if (init) c(init, state, 'Expression');
};

export const VariableDeclaration = (node, state, c) => {
    state.declaration = node.kind;
    base.VariableDeclaration(node, state, c);
    state.declaration = null;
};

export const VariablePattern = ({ name }, { scope }) => {
    if (scope[name]) scope[name] = false;
};