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

export function callExpression({ callee, args = [] }) {
    return {
        type: 'CallExpression',
        callee,
        arguments: args
    };
}