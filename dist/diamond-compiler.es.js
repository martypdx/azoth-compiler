import { base, recursive } from 'acorn/dist/walk.es';
import { parse } from 'acorn';
import { generate } from 'astring';
import htmlparser from 'htmlparser2';
import undeclared from 'undeclared';

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

    set(string, value) {
        this.map.set(string, value);
    }

    get all() {
        return [...this.map.keys()];
    }

    get values() {
        return [...this.map.values()];
    }
}

const TAG = '_';

class State {
    constructor() {
        this._imports = new UniqueStrings();
        this._binders = new UniqueStrings();
        this._fragments = new UniqueStrings();
        this.tag = TAG;
        this.specifiers = null;
        this.scope = null;
        this.functionScope = null;
    }

    get imports() { return this._imports.all; }
    get binders() { return this._binders.values; }
    get fragments() { return this._fragments.all; }

    addFragment(html) {
        return this._fragments.add(html);
    }

    addBinder(binder) {
        const name = binder.writeImport();
        this._imports.add(name);
        
        const typeImport = binder.typeImport;
        if(typeImport) this._imports.add(typeImport);

        const arg = binder.writeInit();
        const value = { name, arg };
        const unique = JSON.stringify(value);
        return this._binders.add(unique, value);
    }
}

const DEFAULTS = {
    ecmaVersion: 8,
    sourceType: 'module'
};

function ast(source, options) {
    return parse(source, Object.assign({}, DEFAULTS, options));
}

const VALUE = Symbol('value');
const MAP = Symbol('map');
const SUBSCRIBE = Symbol('subscribe');

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
    
    return Array
        .from(undeclared(ast).values())
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

    writeHtml() {
        return this.target.html;
    }

    writeInit() {
        return this.target.init(this);
    }

    writeImport() {
        return this.target.import;
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

        const expr = isIdentifier ? ast.name : generate(ast);
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

    addSubscribe(observable, observer) {
        return `${observable}.subscribe(${observer})`;
    }

    // [sub templates]

    // unsubscribe?
}

class ChildNodeBinder extends Binder {

    constructor(options, target) { 
        super(options, target);
        this.index = -1;
    }

    // init(el) {
    //     this.index = el.childIndex;
    // }
}

// const attrPattern = /\s*?([a-zA-Z0-9\-]+?)=$/;

// const specials = {
//     on: 'event',
//     class: 'class'
// };

class AttributeBinder extends Binder {
    
    constructor(options, target) {
        super(options, target);
        this.name = '';
    }

    // init(el, attr) {
    //     // if (parts.length > 1 && (type = specials[parts[0]])) {
    //     //     delete currentEl.attributes[name];
    //     // }
    //     this.name = attr;
    // }
}

const childNode = (name, html) => ({
    import: name,
    html,
    init(binder) {
        return binder.index;
    }
});

const text = childNode('__textBinder', '<text-node></text-node>');
const block = childNode('__blockBinder', '<block-node></block-node>');
const attribute = {
    import: '__attrBinder',
    html: '""',
    init(binder) {
        return binder.name;
    }
};

function getBinder(options) {

    let Type = null, target = null;
    
    if (options.inAttributes) {
        Type = AttributeBinder;
        if (options.block) {
            throw new Error('Attribute Blocks not yet supported');
        }
        target = attribute;
    }
    else {
        Type = ChildNodeBinder;
        target = options.block ? block : text;
    }

    return new Type(options, target);
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
        // quasi is one more than expression
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

        parser.write(binder.writeHtml());
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

const BINDER = '__bind';
const FRAGMENT = '__fragment';
const NODES = '__nodes';
const RENDER = '__render';
const SUB = '__sub';

const RENDERER_IMPORT = 'renderer';
const MAKE_FRAGMENT_IMPORT = 'makeFragment';

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

// __bind${moduleIndex}(__nodes[${elementIndex}])
function nodeBinding(moduleIndex, elementIndex) {
    return callExpression({
        callee: identifier(`${BINDER}${moduleIndex}`), 
        args: [memberExpression({
            name: NODES, 
            property: {
                type: 'Literal',
                value: elementIndex,
                raw: `${elementIndex}`
            }, 
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
            name: '__map',
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
            name: '__combine',
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
            args: [{
                type: 'Literal',
                value: arg,
                raw: typeof arg === 'string' ? `"${arg}"` : `${arg}`
            }]
        })
    });
};

// const __nodes = __render${index}();
const renderNodes = index => {
    return declareConst({ 
        name: NODES, 
        init: callExpression({ 
            callee: identifier(`${RENDER}${index}`)
        })
    });
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

const renderer = (html, index) =>{
    return declareConst({ 
        name: `${RENDER}${index}`, 
        init: callExpression({ 
            name: RENDERER_IMPORT,
            args: [
                callExpression({
                    name: MAKE_FRAGMENT_IMPORT,
                    args: [{
                        type: 'Literal',
                        value: html,
                        raw: `\`${html}\``
                    }]
                })
            ]
        })
    });  
};

const MODULE_NAME = 'diamond';
const SPECIFIER_NAME = 'html';

const TaggedTemplateExpression = (node, state, c) => {
    base.TaggedTemplateExpression(node, state, c);

    if (node.tag.name !== state.tag) return;
    const { html, binders } = parseTemplate(node.quasi);
    const index = state.addFragment(html);

    binders.forEach(b => {
        b.matchObservables(state.scope);
        b.moduleIndex = state.addBinder(b);
    });
    
    const newAst = templateAFE({ binders, index });
    TTEtoAFE(node, newAst);
};

const Program = (node, state, c) => {
    base.Program(node, state, c);

    const { body } = node;
    const { fragments, binders, imports, specifiers } = state;

    body.splice(0, 0, 
        ...fragments.map(renderer), 
        ...binders.map(initBinder));

    if(specifiers) {
        const binderImports = imports.map(name => specifier(name));
        specifiers.push(...binderImports);
    }
};

const ImportDeclaration = (node, state, c) => {
    base.ImportDeclaration(node, state, c);
    
    const { source, specifiers } = node;
    if(!source.value.endsWith(MODULE_NAME)) return;
    
    state.specifiers = specifiers;
    const imports = [RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT].map(specifier);
    specifiers.push(...imports);
    
    const index = specifiers.findIndex(({ imported }) => imported.name === SPECIFIER_NAME); 
    if(index > -1) {
        state.tag = specifiers[index].local.name;
        specifiers.splice(index, 1);
    }
};

var templates = Object.freeze({
	TaggedTemplateExpression: TaggedTemplateExpression,
	Program: Program,
	ImportDeclaration: ImportDeclaration
});

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

    // modification of acorn's Function walk.
    // https://github.com/ternjs/acorn/blob/master/src/walk/index.js#L262-L267
const Function = (node, state, c) => {
    const { scope, functionScope } = state;
    state.scope = state.functionScope = Object.create(scope);

    node.params = vars(node.params, state, c, node => c(node, state, 'Pattern'));

    c(node.body, state, node.expression ? 'ScopeExpression' : 'ScopeBody');

    state.scope = scope;
    state.functionScope = functionScope;
};

const BlockStatement = (node, state, c) => {
    const { scope } = state;
    state.scope = Object.create(scope);
    base.BlockStatement(node, state, c);
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
    base.VariableDeclaration(node, state, c);
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

    const handlers = Object.assign({}, templates, observables);

    recursive(ast$$1, new State(), handlers);

    return generate(ast$$1);
}

export default compile$1;
