import { base } from 'acorn/dist/walk.es';
const IDENTIFIER = '$';

function vars(nodes, state, c, elseFn) {
    return nodes.map(node => {
        if (node.type === 'AssignmentPattern' && node.right.name === IDENTIFIER) {
            c(node, state, 'Observable');
            return node.left;
        }
        else if(elseFn) elseFn(node);
        
        return node;
        
    });
}

export const Observable = (node, { scope, functionScope, declaration }) => {
    const addTo = declaration === 'var' ? functionScope : scope;
    return addTo[node.left.name] = true;
};

    // modification of acorn's Function walk.
    // https://github.com/ternjs/acorn/blob/master/src/walk/index.js#L262-L267
export const Function = (node, state, c) => {
    const { scope, functionScope } = state;
    state.scope = state.functionScope = Object.create(scope);

    node.params = vars(node.params, state, c, node => c(node, state, 'Pattern'));

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
        const newValues = vars(id.properties.map(p => p.value), state, c);
        id.properties.forEach((p, i) => p.value = newValues[i]);
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