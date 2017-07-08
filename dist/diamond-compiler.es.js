import { base, recursive } from 'acorn/dist/walk.es';
import htmlparser from 'htmlparser2';
import undeclared from 'undeclared';
import { parse } from 'acorn';
import { baseGenerator, generate } from 'astring';

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

const FIRST_IMPORT = '__first';
const MAP_IMPORT = '__map';
const COMBINE_IMPORT = '__combine';

const RENDERER_IMPORT = 'renderer';
const MAKE_FRAGMENT_IMPORT = 'makeFragment';

const COMBINE = Symbol('combine');
const COMBINE_FIRST = Symbol('combine-first');
const FIRST = Symbol('first');
const MAP = Symbol('map');
const MAP_FIRST = Symbol('map-first');
const SUBSCRIBE = Symbol('subscribe');
const VALUE = Symbol('value');

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
// () => {<body>}  ???
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

function addStatementsToFunction({ fn, statements, returnBody = false })  {
    let { body } = fn;
    if(body.type === 'BlockStatement') {
        body.body.splice(0, 0, ...statements);
    } else {
        if(returnBody) statements.push(returnStatement({ arg: body }));
        fn.body = blockStatement({ body: statements });
    }
}

const SPECIFIER_NAME = /html|_/;
const baseNames = [RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT];
const baseSpecifiers = baseNames.map(specifier);

const importSpecifiers = {
    [COMBINE]: COMBINE_IMPORT,
    [COMBINE_FIRST]: COMBINE_IMPORT,
    [FIRST]: FIRST_IMPORT,
    [MAP]: MAP_IMPORT,
    [MAP_FIRST]: MAP_IMPORT,
    [SUBSCRIBE]: null,
    [VALUE]: null,
};

class Imports {
    constructor({ tag }) {
        this.names = new Set(baseNames);
        this.ast = [];
        this.tag = tag;
    }

    addBinder({ declaration: { name }, type }) {
        this.addName(name);
        const typeImport = importSpecifiers[type];
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
            if (binder.type === VALUE) return;
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

function initBinder({ name, arg, index }) {
    return declareConst({
        name: `${BINDER}${index}`,
        init: callExpression({
            name,
            args: [
                literal({ value: arg })
            ]
        })
    });
}

const bindings = {
    [COMBINE]: combineBinding,
    [COMBINE_FIRST]: combineFirstBinding,
    [FIRST]: firstBinding,
    [MAP]: mapBinding,
    [MAP_FIRST]: mapFirstBinding,
    [SUBSCRIBE]: subscribeBinding,
    [VALUE]: valueBinding,
};

function binding(binder, i) {
    const binding = bindings[binder.type];
    return binding(binder, i);
}

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
function valueBinding(binder) {
    const { ast, moduleIndex, elIndex } = binder;

    return {
        type: 'ExpressionStatement',
        expression: callExpression({
            callee: nodeBinding(moduleIndex, elIndex),
            args: [ast]
        })
    };
}

// const __sub${index} = <init>
function subscription(index, init) {
    return declareConst({
        name: `${SUB}${index}`, 
        init
    });
}

// const __sub${binderIndex} = (<ast>).subscribe(<nodeBinding>);
function subscribeBinding(binder, index) {
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
}

// const __sub${binderIndex} = __first(observable, <nodeBinding>);
function firstBinding(binder, binderIndex) {
    const { moduleIndex, elIndex, observables: [ name ] } = binder;
    const observable = identifier(name);
    const args = [
        observable, 
        nodeBinding(moduleIndex, elIndex)
    ];

    return subscription(
        binderIndex, 
        callExpression({
            name: FIRST_IMPORT,
            args
        }) 
    );
}

function addOnce(args) {
    args.push(literal({ value: true }));
}

function mapFirstBinding(binder, binderIndex) {
    return mapBinding(binder, binderIndex, true);
}

// const __sub${binderIndex} = __map(observable, observable => (<ast>), <nodeBinding> [, true]);
function mapBinding(binder, binderIndex, firstValue = false) {
    const { ast, moduleIndex, elIndex, observables: [ name ] } = binder;
    const observable = identifier(name);
    const args = [
        observable, 
        arrowFunctionExpression({ 
            body: ast,
            params: [observable]
        }),
        nodeBinding(moduleIndex, elIndex)
    ];
    if(firstValue) addOnce(args);

    return subscription(
        binderIndex, 
        callExpression({
            name: MAP_IMPORT,
            args
        }) 
    );
}

function combineFirstBinding(binder, binderIndex) {
    return combineBinding(binder, binderIndex, true);
}

// const __sub${binderIndex} = __combine([o1, o2, o3], (o1, o2, o3) => (<ast>), <nodeBinding> [, true]);
function combineBinding(binder, binderIndex, firstValue = false) {
    const { ast, moduleIndex, elIndex, observables } = binder;
    const params = observables.map(identifier);
    const args =  [
        arrayExpression({ elements: params }), 
        arrowFunctionExpression({ 
            body: ast,
            params
        }),
        nodeBinding(moduleIndex, elIndex)
    ];
    if(firstValue) addOnce(args);

    return subscription(
        binderIndex, 
        callExpression({
            name: COMBINE_IMPORT,
            args
        }) 
    );
}

const NONE = Symbol('none');
const STAR = Symbol('*');
const AT = Symbol('@');

const typeMap = {
    '': NONE,
    '*': STAR,
    '@': AT
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

    let sigil = NONE;

    if(tryEscaped()) return { sigil, text };

    text = text.replace(bindingMatch, m => {
        sigil = typeMap[m];
        return '';
    });

    return { sigil, text };
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

function match(ast, scope) {
    if(ast.type === 'Identifier') {
        return scope[ast.name] ? [ast.name] : [];
    }

    const undeclareds = undeclared(ast).values();
    
    return Array
        .from(undeclareds)
        .filter(name => scope[name]);
}

class Binder {

    constructor({ sigil = NONE, ast = null } = {}, target) {        
        this.sigil = sigil;
        this.ast = ast;
        this.target = target;
        
        this.observables = [];
        this.elIndex = -1;
        this.moduleIndex = -1;
        
        this.index = -1;
        this.name = '';        
    }

    init(el, attr) {
        this.index = el.childIndex;
        this.name = attr;
    }

    get html() {
        return this.target.html;
    }

    get declaration() {
        return this.target.init(this);
    }

    matchObservables(scope) {
        this.observables = match(this.ast, scope);
    }

    get type() {
        const { sigil, ast, observables } = this;
        const isIdentifier = ast.type === 'Identifier';
        const count = observables.length;
        const isTrueMap = sigil === STAR;

        if(sigil === AT) return SUBSCRIBE;
        if(!count) return VALUE;
        if(isIdentifier) return isTrueMap ? SUBSCRIBE : FIRST;
        if(count === 1) return isTrueMap ? MAP : MAP_FIRST;
        return isTrueMap ? COMBINE : COMBINE_FIRST;
    }
}

const childNode = (name, html) => ({
    html,
    init({ index }) {
        return {
            name: name,
            arg: index
        };
    }
});

const text = childNode('__textBinder', '<text-node></text-node>');
const block = childNode('__blockBinder', '<block-node></block-node>');

const attribute = {
    html: '""',
    init({ name }) {
        return { 
            name: '__attrBinder',
            arg: name
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

// these are from htmlparser2
// TODO: add in SVG?

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

            //Notice array of arrays. 
            //Binders from each el are being pushed.
            //Order matters as well because this is how we get 
            //element binding index in right order.

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
        // quasis length is one more than expressions
        if(i === expressions.length) return parser.write(quasi.value.raw);

        const { sigil, text } = getBindingType(quasi.value.raw);

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
            sigil,
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
    const statements = templateStatements(options);
    const { fn, returnStatement: returnStatement$$1 } = options;
    if(fn) {
        if(fn.body === node) {
            addStatementsToFunction({ fn, statements });
            return;
        }
        if(returnStatement$$1 && returnStatement$$1.argument === node) {
            const block = fn.body.body;
            const index = block.findIndex(n => n === returnStatement$$1);
            block.splice(index, 1, ...statements);
            return;
        }
    } 

    const ast = arrowFunctionExpression({ block: statements });
    Object.assign(node, ast);
};

const templateStatements = ({ binders, index }) => {
    const bindings = binders.map(binding);
    return [
        renderNodes(index),
        ...bindings,
        ...fragment(binders)
    ];
};

const TAG = '_';
const MODULE_NAME = 'diamond-ui';

class Module {
    constructor({ tag = TAG } = {}) {
        this.name = MODULE_NAME;
        // TODO: tag comes back from imports
        // and may be aliased so this needs
        // to account for that
        this.tag = tag;
        this.imports = new Imports({ tag });
        this.fragments = new UniqueStrings();
        this.binders = new UniqueStrings();
        
        // track scope and current function
        this.scope = null;
        this.functionScope = null;
        this.fn = null;
        this.returnStatement = null;
        
        // all purpose module-wide 
        // ref counter for destructuring
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
        
        // TODO: fn gets set by the observables handlers,
        // which makes this cross those set of handlers.
        // Probably should combine into one set.
        templateToFunction(node, { 
            binders, 
            index,
            fn: this.fn,
            returnStatement: this.returnStatement
        });
    }
}

const ACORN_DEFAULTS = {
    ecmaVersion: 8,
    sourceType: 'module'
};

function parse$1(source, options) {
    return parse(source, Object.assign({}, ACORN_DEFAULTS, options));
}

// work around for https://github.com/davidbonnet/astring/issues/21
const generator = Object.assign({}, baseGenerator, {
    ArrowFunctionExpression: function(node, state) {
        state.write('(');
        baseGenerator.ArrowFunctionExpression(node, state);
        state.write(')');
    }
});

const ASTRING_DEFAULTS = { 
    ident: '    ',
    generator 
};

function generate$1(ast, options) {
    return generate(ast, Object.assign({}, ASTRING_DEFAULTS, options));
}

const TaggedTemplateExpression = (node, module, c) => {
    base.TaggedTemplateExpression(node, module, c);
    if (node.tag.name !== module.tag) return;
    module.makeTemplate(node);
};

const Program = (node, module, c) => {
    base.Program(node, module, c);
    module.addDeclarations(node.body);
};

const ImportDeclaration = ({ source, specifiers }, { name, imports }) => {
    if(!source.value.endsWith(name)) return;
    imports.specifiers = specifiers;
};

const ReturnStatement = (node, module, c) => {
    const prior = module.returnStatement;
    module.returnStatement = node;
    base.ReturnStatement(node, module, c);
    module.returnStatement = prior;
};

var templates = Object.freeze({
	TaggedTemplateExpression: TaggedTemplateExpression,
	Program: Program,
	ImportDeclaration: ImportDeclaration,
	ReturnStatement: ReturnStatement
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
        addStatementsToFunction({ fn, statements, returnBody: true });
    }
    return [...state.identifiers];
}

//TODO: get variables working


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

    recursive(ast, state, {
        AssignmentPattern(node, state, c) {
            if(node.right.name !== IDENTIFIER$1 || node !== ast) return;
            ast = node.left;
            base.Pattern(node.left, state, c);
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

    // this call may mutate the function by creating a
    // BlockStatement if params are destructured and 
    // function was arrow with implicit return
    const observables = params(node, getRef);
    observables.forEach(o => newScope[o] = true);

    const priorFn = state.fn;
    state.fn = node;

    c(node.body, state, node.expression ? 'ScopeExpression' : 'ScopeBody');
    
    state.fn = priorFn;
    state.scope = scope;
    state.functionScope = functionScope;
};

const BlockStatement = (node, state, c) => {
    const { scope } = state;
    state.scope = Object.create(scope);
    state.__block = node.body;
    base.BlockStatement(node, state, c);
    state.scope = scope;
};

const VariableDeclarator = ({ id, init }, state, c) => {
    if(id && id.type === 'ObjectPattern') {
        const newValues = vars(id.properties.map(p => p.value), state, c);
        id.properties.forEach((p, i) => p.value = newValues[i]);
    }
    if(init) c(init, state, 'Expression');
};

const VariableDeclaration = (node, state, c) => {
    state.declaration = node.kind;
    base.VariableDeclaration(node, state, c);
    state.declaration = null;
};

const VariablePattern = ({ name }, { scope }) => {
    if(scope[name]) scope[name] = false;
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
    const ast = parse$1(source);
    astTransform(ast);
    return generate$1(ast);
}

const handlers = Object.assign({}, templates, observables);

function astTransform(ast) {
    recursive(ast, new Module(), handlers);
}

export default compile$1;
