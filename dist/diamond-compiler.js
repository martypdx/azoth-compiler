'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var acorn_dist_walk = require('acorn/dist/walk');
var htmlparser = _interopDefault(require('htmlparser2'));
var astring = require('astring');
var undeclared = _interopDefault(require('undeclared'));
var acorn = require('acorn');

class UniqueStrings {
    constructor() {
        this.map = new Map();
    }

    add(string, value = {}) {
        const { map } = this;
        if(map.has(string)) return map.get(string).index;

        const index = value.index = map.size;
        map.set(string, value);
        return index;
    }

    get all() {
        return [...this.map.keys()];
    }

    get values() {
        return [...this.map.values()];
    }
}

const BINDER = '__bind';
const FRAGMENT = '__fragment';
const NODES = '__nodes';
const RENDER = '__render';
const SUB = '__sub';
const MAP_OPERATOR = '__map';
const COMBINE_OPERATOR = '__combine';

const RENDERER_IMPORT = 'renderer';
const MAKE_FRAGMENT_IMPORT = 'makeFragment';

function declareConst({ name, init }) {
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


function identifier(name) {
    return { type: 'Identifier', name };
}

const from = value => typeof value === 'string' ? `"${value}"` : `${value}`;

function literal({ value, raw = from(value) }) {
    return { type: 'Literal', value, raw };
}

function blockStatement({ body = [] }) {
    return {
        type: 'BlockStatement',
        body
    };
}

function returnStatement({ arg }) {
    return {
        type: 'ReturnStatement',
        argument: arg
    };
}

function arrayExpression({ elements }) {
    return {
        type: 'ArrayExpression',
        elements
    };
}

function memberExpression({ name, object, property, computed = false }) {
    if(name) object = identifier(name);
    return {
        type: 'MemberExpression',
        object,
        property,
        computed
    };
}

// <callee>(<args>)
function callExpression({ callee, name, args = [] }) {
    if(name) callee = identifier(name);
    return {
        type: 'CallExpression',
        callee,
        arguments: args
    };
}

// (() => {<body>}())
const arrowFunctionExpression = ({ body, block, params = [] }) => {
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
const specifier = name => ({
    type: 'Import Specifier',
    imported: identifier(name),
    local: identifier(name)
});

const SPECIFIER_NAME = /html|_/;
const baseNames = [RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT];
const baseSpecifiers = baseNames.map(specifier);

class Imports {
    constructor({ tag }) {
        this.names = new Set(baseNames);
        this.ast = [];
        this.tag = tag;
    }

    addBinder({ declaration: { name }, typeImport }) {
        this.addName(name);
        if(typeImport) this.addName(typeImport);     
    }

    addName(name) {
        const { ast, names } = this;
        if(!ast || names.has(name)) return;
        names.add(name);
        this.ast.push(specifier(name));
    }

    set specifiers(specifiers) {
        this.ast = specifiers;
        const index = specifiers.findIndex(({ imported }) => SPECIFIER_NAME.test(imported.name)); 
        if(index > -1) {
            this.tag = specifiers[index].local.name;
            specifiers.splice(index, 1);
        }
        specifiers.push(...baseSpecifiers.slice());
    }
}

const renderer = (html, index) =>{
    return declareConst({ 
        name: `${RENDER}${index}`, 
        init: callExpression({ 
            name: RENDERER_IMPORT,
            args: [
                callExpression({
                    name: MAKE_FRAGMENT_IMPORT,
                    args: [literal({
                        value: html,
                        raw: `\`${html}\``
                    })]
                })
            ]
        })
    });  
};

// __nodes.length
const NODES_LENGTH = memberExpression({
    name: NODES, 
    property: identifier('length')
});

// NOTE: because we add fragment to NodeList manually,
// length is actually off by one. hence NOT [<NODES_LENGTH> - 1]
// __nodes[<NODES_LENGTH>]
const LAST_NODE = memberExpression({
    name: NODES, 
    property: NODES_LENGTH,
    computed: true
}); 

// const __fragment = __nodes[__nodes.length - 1];
const DECLARE_FRAGMENT = declareConst({
    name: FRAGMENT, 
    init: LAST_NODE
});  

// return __fragment;
const RETURN_FRAGMENT = {
    type: 'ReturnStatement',
    argument: identifier(FRAGMENT)
};

// return __nodes[__nodes.length - 1];
const DIRECT_RETURN = {
    type: 'ReturnStatement',
    argument: LAST_NODE
};

// __sub${index}.unsubscribe();
const unsubscribe = index => {
    const callee = memberExpression({
        name: `${SUB}${index}`, 
        property: identifier('unsubscribe')
    });

    return {
        type: 'ExpressionStatement',
        expression: callExpression({ callee })
    };
};

const unsubscribes = binders => {
    return binders
        // map first because we need to 
        // preserve original index as subscriber 
        // index, i.e. __sub0
        .map((binder, i) => {
            if (!binder.isSubscriber) return;
            return unsubscribe(i);
        })
        .filter(unsub => unsub);
};


// __fragment.unsubscribe = () => {
//     ${unsubscribes}
// };
const fragmentUnsubscribe = unsubscribes => {
    return   {
        type: 'ExpressionStatement',
        expression: {
            type: 'AssignmentExpression',
            operator: '=',
            left: memberExpression({
                name: FRAGMENT,
                property: identifier('unsubscribe')
            }),
            right: arrowFunctionExpression({ block: unsubscribes })
        }
    };
};

var fragment = binders => {
    const unsubs = unsubscribes(binders);
    if(!unsubs.length) return [DIRECT_RETURN];
    return [
        DECLARE_FRAGMENT,
        fragmentUnsubscribe(unsubs),
        RETURN_FRAGMENT
    ];
};

const VALUE = Symbol('value');
const MAP = Symbol('map');
const SUBSCRIBE = Symbol('subscribe');

// __bind${moduleIndex}(__nodes[${elementIndex}])
function nodeBinding(moduleIndex, elementIndex) {
    return callExpression({
        callee: identifier(`${BINDER}${moduleIndex}`), 
        args: [memberExpression({
            name: NODES, 
            property: literal({ value: elementIndex }), 
            computed: true
        })]
    });
}

// <nodeBinding>(<ast>);
const valueBinding = binder => {
    const { ast, moduleIndex, elIndex } = binder;

    return {
        type: 'ExpressionStatement',
        expression: callExpression({
            callee: nodeBinding(moduleIndex, elIndex),
            args: [ast]
        })
    };
};

const subscription = (index, init) => {
    return declareConst({
        name: `${SUB}${index}`, 
        init
    });
};

// const __sub${binderIndex} = (<ast>).subscribe(<nodeBinding>);
const subscribeBinding = (binder, index) => {
    const { ast, moduleIndex, elIndex } = binder;

    return subscription(
        index, 
        callExpression({
            callee: memberExpression({ 
                object: ast, 
                property: identifier('subscribe')
            }),
            args: [nodeBinding(moduleIndex, elIndex)]
        }) 
    );
};

const expressionBinding = (binder, index) => {
    switch(binder.observables.length) {
        case 0:
            return valueBinding(binder, index);
        case 1:
            return mapBinding(binder, index);
        default:
            return combineBinding(binder, index);
    }
};

// const __sub${binderIndex} = __map(observable, observable => (<ast>), <nodeBinding>);
const mapBinding = (binder, binderIndex) => {
    const { ast } = binder;
    if(ast.type === 'Identifier') return subscribeBinding(binder, binderIndex);
    
    const { moduleIndex, elIndex, observables: [ name ] } = binder;
    const observable = identifier(name);
    return subscription(
        binderIndex, 
        callExpression({
            name: MAP_OPERATOR,
            args: [
                observable, 
                arrowFunctionExpression({ 
                    body: ast,
                    params: [observable]
                }),
                nodeBinding(moduleIndex, elIndex)
            ]
        }) 
    );
};


// const __sub${binderIndex} = __combine([o1, o2, o3], (o1, o2, o3) => (<ast>), <nodeBinding>);
const combineBinding = (binder, binderIndex) => {
    const { ast, moduleIndex, elIndex, observables } = binder;
    const params = observables.map(identifier);
    return subscription(
        binderIndex, 
        callExpression({
            name: COMBINE_OPERATOR,
            args: [
                arrayExpression({ elements: params }), 
                arrowFunctionExpression({ 
                    body: ast,
                    params
                }),
                nodeBinding(moduleIndex, elIndex)
            ]
        }) 
    );
};

var binding = (binder, i) => {
    const { type } = binder;

    switch(type) {
        case VALUE:
            return valueBinding(binder, i);
        case SUBSCRIBE:
            return subscribeBinding(binder, i);
        case MAP:
            return expressionBinding(binder, i);
        default:
            throw new Error(`Unsupported binding type ${type}`);
    }
};

const initBinder = ({ name, arg, index }) => {
    return declareConst({
        name: `${BINDER}${index}`,
        init: callExpression({
            name,
            args: [
                literal({ value: arg })
            ]
        })
    });
};

const types = {
    '*': MAP,
    '@': SUBSCRIBE
};

const escapedBindingMatch = /\\[*@]$/;
const bindingMatch = /[\*@]$/;

function getBindingType(text) {

    const tryEscaped = () => {
        let escaped = false;
        text = text.replace(escapedBindingMatch, m => {
            escaped = true;
            return m[m.length - 1];
        });
        return escaped;
    };

    let type = VALUE;

    if(tryEscaped()) return { type, text };

    text = text.replace(bindingMatch, m => {
        type = types[m];
        return '';
    });

    return { type, text };
}

const escapedBlockMatch = /^\\#/;
const blockMatch = /^#/;

function getBlock(text) {

    const tryEscaped = () => {
        let escaped = false;
        text = text.replace(escapedBlockMatch, m => {
            escaped = true;
            return m[m.length - 1];
        });
        return escaped;
    };

    let block = false;

    if(tryEscaped()) {
        return {
            block, 
            text
        };
    }

    text = text.replace(blockMatch, () => {
        block = true;
        return '';
    });

    return { block, text };
}

function getObservables(ast, scope) {
    if(ast.type === 'Identifier') {
        return scope[ast.name] ? [ast.name] : [];
    }

    const undeclareds = undeclared(ast).values();
    
    return Array
        .from(undeclareds)
        .filter(name => scope[name]);
}

class Binder {

    constructor({ type = VALUE, ast = null } = {}, target) {        
        this.type = type;
        this.ast = ast;
        this.undeclareds = null;
        this.observables = [];

        this.elIndex = -1;
        this.templates = null;
        
        this.moduleIndex = -1;
        this.target = target;

        this.index = -1;
        this.name = '';        
    }

    init(el, attr) {
        this.index = el.childIndex;
        this.name = attr;
    }

    matchObservables(scope) {
        if(this.type === SUBSCRIBE) return;
        this.observables = getObservables(this.ast, scope);
    }

    get html() {
        return this.target.html;
    }

    get declaration() {
        return this.target.init(this);
    }

    get typeImport() {
        if(this.type !== MAP || this.ast.type === 'Identifier') return;
        
        switch(this.observables.length) {
            case 0:
                return;
            case 1:
                return '__map';
            default:
                return '__combine';
        }
    }

    get isSubscriber() {
        const { type, observables } = this;
        return (type === SUBSCRIBE || (!!observables && observables.length > 0));
    }

    writeBinding(observer) { 
        const { ast, observables, type } = this;
        const isIdentifier = ast.type === 'Identifier';

        const expr = isIdentifier ? ast.name : astring.generate(ast);
        if ((!observables || !observables.length) && type !== SUBSCRIBE) {
            return `${observer}(${expr})`;
        }

        let observable = '';

        if(isIdentifier) {
            observable = expr;
        }
        else {
            if (type === SUBSCRIBE) {
                observable = `(${expr})`;
            }
            else {
                observable = observables.join();
                const map = `(${observable}) => (${expr})`;

                if (observables.length > 1) {
                    observable = `combineLatest(${observable}, ${map})`;
                }
                else {
                    observable += `.map(${map})`;
                }
            }
        }

        if(type === VALUE) observable += `.first()`;

        return this.addSubscribe(observable, observer);
    }


}

const childNode = (name, html) => ({
    html,
    init(binder) {
        return {
            name: name,
            arg: binder.index
        };
    }
});

const text = childNode('__textBinder', '<text-node></text-node>');
const block = childNode('__blockBinder', '<block-node></block-node>');

const attribute = {
    html: '""',
    init(binder) {
        return { 
            name: '__attrBinder',
            arg: binder.name
        };
    }
};

function getBinder(options) {

    let target = null;
    
    if (options.inAttributes) {
        if (options.block) {
            throw new Error('Attribute Blocks not yet supported');
        }
        target = attribute;
    }
    else {
        target = options.block ? block : text;
    }

    return new Binder(options, target);
}

var voidElements = {
    __proto__: null,
    area: true,
    base: true,
    basefont: true,
    br: true,
    col: true,
    command: true,
    embed: true,
    frame: true,
    hr: true,
    img: true,
    input: true,
    isindex: true,
    keygen: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true
};

const getEl = (name = 'root') => ({
    name, 
    attributes: {}, 
    binders: [],
    childBinders: [],
    childIndex: -1
});

function parseTemplate({ expressions, quasis }) {

    const fragment = getEl();
    const html = [];
    const stack = [];
    let currentEl = fragment;
    let inAttributes = false;
    let currentAttr = null;

    let allBinders = null;
    
    const handler = {
        onopentagname(name) {
            currentEl.childIndex++;
            stack.push(currentEl);
            currentEl = getEl(name);
            inAttributes = true;
        },
        onattribute(name, value) {
            currentEl.attributes[currentAttr = name] = value;
        },
        onopentag(name) {
            const el = currentEl;
            const { attributes } = el;
            // TODO: Switch to Object.values, but needs node.js version 7.x - wait for 8.x?
            const attrsText = Object.keys(attributes)
                .reduce((text, key) => {
                    // NOTE: currently not distinguishing between empty string and valueless attribute.
                    // htmlparser2 does not distinguish and html spec says empty string 
                    // and boolean are equivalent
                    const value = attributes[key];
                    return `${text} ${key}="${value}"`;
                },'');

            el.htmlIndex = -2 + html.push(
                `<${name}${attrsText}`,
                '',
                `>`
            );

            currentAttr = null;
            inAttributes = false;
        },
        ontext(text) {
            html.push(text);
            if(currentEl) currentEl.childIndex++;
        },
        add(binder) { 
            const el = currentEl;
            binder.init(el, currentAttr || '');
            el.binders.push(binder);
        },
        onclosetag(name) {
            if(!voidElements[name]) html.push(`</${name}>`);
            const el = currentEl;
            currentEl = stack.pop();

            if(el.binders.length > 0) {
                html[el.htmlIndex] = ` data-bind`;
                currentEl.childBinders.push(el.binders);
            }

            if (el.childBinders.length > 0) {
                currentEl.childBinders.push(...el.childBinders);
            }
        },
        onend() {
            allBinders = [...fragment.childBinders, fragment.binders];
        }
    };

    var parser = new htmlparser.Parser(handler);

    quasis.forEach((quasi, i) => {
        // quasi length is one more than expression
        if(i === expressions.length) return parser.write(quasi.value.raw);

        const { type, text } = getBindingType(quasi.value.raw);

        parser.write(text);

        let block = false;
        if(i < quasis.length) {
            const value = quasis[i + 1].value;
            const result = getBlock(value.raw);
            value.raw = result.text;
            block = result.block;
        }
        
        const binder = getBinder({
            block,
            type,
            inAttributes,
            ast: expressions[i]
        });

        parser.write(binder.html);
        handler.add(binder);
    });

    parser.end();

    const binders = allBinders.reduce((all, binders, i) => {
        binders.forEach(b => b.elIndex = i);
        all.push(...binders);
        return all;
    }, []);

    return { 
        html: html.join(''),
        binders
    };
}

// const __nodes = __render${index}();
const renderNodes = index => {
    return declareConst({ 
        name: NODES, 
        init: callExpression({ 
            callee: identifier(`${RENDER}${index}`)
        })
    });
};

const templateToFunction = (node, options) => {
    const newAst = templateAFE(options);
    TTEtoAFE(node, newAst);
};

const templateAFE = ({ binders, index }) => {
    const bindings = binders.map(binding);
    const statements = [
        renderNodes(index),
        ...bindings,
        ...fragment(binders)
    ];
    return arrowFunctionExpression({ block: statements });
};

const TTEtoAFE = (node, AFE) => {
    node.type = 'CallExpression',
    node.callee = AFE;
};

const TAG = '_';
const MODULE_NAME = 'diamond';

class Module {
    constructor({ tag = TAG } = {}) {
        this.name = MODULE_NAME;
        // TODO: tag comes back from imports
        // because may be aliased
        this.tag = tag;
        this.imports = new Imports({ tag });

        this.fragments = new UniqueStrings();
        this.binders = new UniqueStrings();
        
        this.scope = null;
        this.functionScope = null;
        
        let ref = 0;
        this.getRef = () => `__ref${ref++}`;
    }

    addDeclarations(body) {
        const { fragments, binders } = this;

        body.splice(0, 0, 
            // TODO: rename: all --> keys
            ...fragments.all.map(renderer), 
            ...binders.values.map(initBinder)
        );
    }

    addFragment(html) {
        return this.fragments.add(html);
    }

    addBinder(binder) {
        this.imports.addBinder(binder);

        const { declaration } = binder;
        const unique = JSON.stringify(declaration);
        return this.binders.add(unique, declaration);
    }

    makeTemplate(node) {
        const { html, binders } = parseTemplate(node.quasi);

        const index = this.addFragment(html);
        binders.forEach(b => {
            b.matchObservables(this.scope);
            b.moduleIndex = this.addBinder(b);
        });
        
        templateToFunction(node, { binders, index });
    }
}

const DEFAULTS = {
    ecmaVersion: 8,
    sourceType: 'module'
};

function ast(source, options) {
    return acorn.parse(source, Object.assign({}, DEFAULTS, options));
}

const TaggedTemplateExpression = (node, module, c) => {
    acorn_dist_walk.base.TaggedTemplateExpression(node, module, c);
    if (node.tag.name !== module.tag) return;
    module.makeTemplate(node);
};

const Program = (node, module, c) => {
    acorn_dist_walk.base.Program(node, module, c);
    module.addDeclarations(node.body);
};

const ImportDeclaration = ({ source, specifiers }, { name, imports }) => {
    if(!source.value.endsWith(name)) return;
    imports.specifiers = specifiers;
};

var templates = Object.freeze({
	TaggedTemplateExpression: TaggedTemplateExpression,
	Program: Program,
	ImportDeclaration: ImportDeclaration
});

const IDENTIFIER$1 = '$';

function params(fn, getRef) {
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
        let { body } = fn;
        if(body.type === 'BlockStatement') {
            body.body.splice(0, 0, ...state.statements);
        } else {
            fn.body = blockStatement({ 
                body: [
                    ...statements,
                    returnStatement({ arg: body })
                ] 
            });
        }
    }
    return [...state.identifiers];
}

//TODO


// function make(funcs, base = defaultBase) {
//     return funcs ? Object.assign({}, base, funcs) : base;
// }

// function recursive2(node, state, funcs, base, override) {
//     let visitor = make(funcs, base);
//     (function c(node, st, override) {
//         console.log(override || node.type, generate(node));
//         visitor[override || node.type](node, st, c);
//     })(node, state, override);
// }

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

    acorn_dist_walk.recursive(ast, state, {
        AssignmentPattern(node, state, c) {
            if(node.right.name !== IDENTIFIER$1 || node !== ast) return;
            ast = node.left;
            acorn_dist_walk.base.Pattern(node.left, state, c);
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

const Observable = (node, { scope, functionScope, declaration }) => {
    const addTo = declaration === 'var' ? functionScope : scope;
    return addTo[node.left.name] = true;
};

// modification of acorn's "Function" base visitor.
// https://github.com/ternjs/acorn/blob/master/src/walk/index.js#L262-L267
const Function = (node, state, c) => {
    const { scope, functionScope, getRef } = state;
    const newScope = state.scope = state.functionScope = Object.create(scope);

    const observables = params(node, getRef);
    observables.forEach(o => newScope[o] = true);

    c(node.body, state, node.expression ? 'ScopeExpression' : 'ScopeBody');

    state.scope = scope;
    state.functionScope = functionScope;
};

const BlockStatement = (node, state, c) => {
    const { scope } = state;
    state.scope = Object.create(scope);
    state.__block = node.body;
    acorn_dist_walk.base.BlockStatement(node, state, c);
    state.scope = scope;
};

const VariableDeclarator = ({ id, init }, state, c) => {
    if (id && id.type === 'ObjectPattern') {
        const newValues = vars(id.properties.map(p => p.value), state, c);
        id.properties.forEach((p, i) => p.value = newValues[i]);
    }
    if (init) c(init, state, 'Expression');
};

const VariableDeclaration = (node, state, c) => {
    state.declaration = node.kind;
    acorn_dist_walk.base.VariableDeclaration(node, state, c);
    state.declaration = null;
};

const VariablePattern = ({ name }, { scope }) => {
    if (scope[name]) scope[name] = false;
};

var observables = Object.freeze({
	Observable: Observable,
	Function: Function,
	BlockStatement: BlockStatement,
	VariableDeclarator: VariableDeclarator,
	VariableDeclaration: VariableDeclaration,
	VariablePattern: VariablePattern
});

function compile$1(source) {
    const ast$$1 = ast(source);
    astTransform(ast$$1);
    return astring.generate(ast$$1);
}

const handlers = Object.assign({}, templates, observables);

function astTransform(ast$$1) {
    acorn_dist_walk.recursive(ast$$1, new Module(), handlers);
}

module.exports = compile$1;
