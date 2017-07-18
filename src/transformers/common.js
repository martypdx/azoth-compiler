
export function declareConst({ name, id, init }) {
    if(name) id = identifier(name);
    return {
        type: 'VariableDeclaration',
        declarations: [{
            type: 'VariableDeclarator',
            id,
            init
        }],
        kind: 'const'
    };
}


export function identifier(name) {
    return { type: 'Identifier', name };
}

const from = value => typeof value === 'string' ? `'${value}'` : `${value}`;

export function literal({ value, raw = from(value) }) {
    return { type: 'Literal', value, raw };
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

// <object>.<property>(<arg>)
export function callMethod({ object, property, arg }) {
    return callExpression({
        callee: memberExpression({ 
            object, 
            property
        }),
        args: [arg]
    });
}

// (() => {<body>}())
// () => {<body>}  ???
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

export function addStatementsToFunction({ fn, statements, returnBody = false })  {
    let { body } = fn;
    if(body.type === 'BlockStatement') {
        body.body.splice(0, 0, ...statements);
    } else {
        if(returnBody) statements.push(returnStatement({ arg: body }));
        fn.body = blockStatement({ body: statements });
    }
}