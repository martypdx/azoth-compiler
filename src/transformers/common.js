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

export function literal(arg) {
    return {
        type: 'Literal',
        value: arg,
        raw: typeof arg === 'string' ? `"${arg}"` : `${arg}`
    };
}

export function blockStatement({ body = [] }) {
    return {
        type: 'BlockStatement',
        body
    };
}

export function returnStatement({ arg }) {
    return {
        type: 'ReturnStatement',
        argument: arg
    };
}

export function arrayExpression({ elements }) {
    return {
        type: 'ArrayExpression',
        elements
    };
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
export const arrowFunctionExpression = ({ body, block, params = [] }) => {
    if(block) { body = { type: 'BlockStatement', body: block }; }

    return {
        type: 'ArrowFunctionExpression',
        id: null,
        generator: false,
        expression: false,
        params,
        body
    };
};

// importMe
export const specifier = name => ({
    type: 'Import Specifier',
    imported: identifier(name),
    local: identifier(name)
});