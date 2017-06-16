export function declareConst({ name, init }) {
    return {
        type: 'VariableDeclaration',
        declarations: [{
            type: 'VariableDeclarator',
            id: identifier(name),
            init
        }],
        kind: 'const'
    };
}

export function identifier(name) {
    return { type: 'Identifier', name };
}

export function memberExpression({ name, object, property, computed = false }) {
    if(name) object = identifier(name);
    return {
        type: 'MemberExpression',
        object,
        property,
        computed
    };
}

// <callee>(<args>)
export function callExpression({ callee, name, args = [] }) {
    if(name) callee = identifier(name);
    return {
        type: 'CallExpression',
        callee,
        arguments: args
    };
}

// (() => {<body>}())
export const arrowFunctionExpression = body => ({
    type: 'ArrowFunctionExpression',
    id: null,
    generator: false,
    expression: false,
    params: [],
    body: {
        type: 'BlockStatement',
        body
    }
});