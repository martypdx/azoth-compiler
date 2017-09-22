import { base, recursive } from 'acorn/dist/walk.es';
import htmlparser from 'htmlparser2';
import estraverse from 'estraverse';
import { parse } from 'acorn';
import { generate } from 'astring';

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

    get keys() {
        return [...this.map.keys()];
    }

    get values() {
        return [...this.map.values()];
    }
}

const CHILD = '__child';
const FRAGMENT = '__fragment';
const NODES = '__nodes';
const RENDER = '__render';
const SUB = '__sub';

const FIRST_IMPORT = '__first';
const MAP_IMPORT = '__map';
const COMBINE_IMPORT = '__combine';

const RENDERER_IMPORT = '__renderer';
const MAKE_FRAGMENT_IMPORT = '__rawHtml';

const COMBINE = Symbol('combine');
const COMBINE_FIRST = Symbol('combine-first');
const FIRST = Symbol('first');
const MAP = Symbol('children');
const MAP_FIRST = Symbol('map-first');
const SUBSCRIBE = Symbol('subscribe');
const VALUE = Symbol('value');

function declareConst({ name, id, init }) {
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


function identifier(name) {
    return { type: 'Identifier', name };
}

const from = value => typeof value === 'string' ? `'${value}'` : `${value}`;

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

// <object>.<property>(<arg>)
function callMethod({ object, property, arg }) {
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

function replaceStatements(block, match, statements) {
    const index = block.findIndex(n => n === match);
    block.splice(index, 1, ...statements);
    return;
}

function addStatementsTo(node, statements, { returnBody = false } = {})  {
    let body = node.type === 'Program' || node.type === 'BlockStatement' ? node : node.body;
    if(body.type === 'BlockStatement' || body.type === 'Program') {
        spliceStatements(body.body, statements);
    } else {
        node.body = replaceBody(body, statements, returnBody);
    }
}

function spliceStatements(body, statements) {
    statements.forEach(({ statements, index }) => {
        body.splice(index, 0, ...statements);
    });
}

function replaceBody(body, statements, returnBody) {
    statements = statements
        .reverse()
        .reduce((all, s) => all.concat(s.statements), []);
    if(returnBody) statements.push(returnStatement({ arg: body }));
    return blockStatement({ body: statements });
}

const TEMPLATE_SPECIFIER_NAME = /html|_/;
const OBSERVABLE_SPECIFIER_NAME = /^\$$/;
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
    constructor({ tag, oTag }) {
        this.names = new Set(baseNames);
        this.ast = [];
        this.tag = tag;
        this.oTag = oTag;
    }

    addBinder({ declarations, type }) {
        declarations.forEach(d => d.name && this.addName(d.name));
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
        const index = specifiers.findIndex(({ imported }) => TEMPLATE_SPECIFIER_NAME.test(imported.name)); 
        if(index > -1) {
            this.tag = specifiers[index].local.name;
            specifiers.splice(index, 1);
        }
        const oIndex = specifiers.findIndex(({ imported }) => OBSERVABLE_SPECIFIER_NAME.test(imported.name)); 
        if(oIndex > -1) {
            this.oTag = specifiers[oIndex].local.name;
            specifiers.splice(oIndex, 1);
        }
        specifiers.push(...baseSpecifiers.slice());
    }
}

// const __render${index} = __renderer(__rawHtml(`${html}`));
const renderer = (html, index) =>{
    
    const makeFragment = callExpression({
        name: MAKE_FRAGMENT_IMPORT,
        args: [literal({
            value: html,
            raw: `\`${html}\``
        })]
    });

    return declareConst({ 
        name: `${RENDER}${index}`, 
        init: callExpression({ 
            name: RENDERER_IMPORT,
            args: [ makeFragment ]
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
const DECLARE_FRAGMENT = declareConst({ name: FRAGMENT, init: LAST_NODE });  

// return __fragment;
const RETURN_FRAGMENT = returnStatement({ arg: identifier(FRAGMENT) });

// return __nodes[__nodes.length - 1];
const DIRECT_RETURN = returnStatement({ arg: LAST_NODE });

// __sub${index}${suffix}.unsubscribe();
const unsubscribe = (index, suffix = '') => {
    const callee = memberExpression({
        name: `${SUB}${index}${suffix}`, 
        property: identifier('unsubscribe')
    });

    return {
        type: 'ExpressionStatement',
        expression: callExpression({ callee })
    };
};

const unsubscribes = (binders, prefix = '') => {
    const unsubs = [];
    binders.forEach((binder, i) => {
        const { type, target } = binder;
        const id = prefix + i;
        if(type && type !== VALUE) unsubs.push(unsubscribe(id));
        if(target.isBlock || target.isComponent) unsubs.push(unsubscribe(id, 'b')); 
        unsubs.push(...unsubscribes(binder.properties, `${id}_`));
    });
    return unsubs;
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

const AT = Symbol('@');
const DOLLAR = Symbol('$');
const NONE = Symbol('none');
const STAR = Symbol('*');
const ELEMENT = Symbol('<#:');

const typeMap = {
    '@': AT,
    '$': DOLLAR,
    '': NONE,
    '*': STAR,
    '<#:': ELEMENT,
};

// TODO: get the values from sigil types.
// TODO: make regex and escape version from base string
const escapedBindingMatch = /\\(\*|\@|\$|<#:)$/;
const errorBindingMatch = /<#:(\*|\@|\$)$/;
const bindingMatch = /(\*|\@|\$|<#:)$/;

function getBindingType(text) {

    if(errorBindingMatch.test(text)) {
        throw new Error('Binding sigils with components are not currently supported');
    }

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

const childNode = (binder, html, isBlock = false) => ({
    isBlock,
    isComponent: false,
    html,
    childIndex: true,
    name: binder,
    indexAdjustment: 0,
    init({ index }) {
        return {
            name: binder,
            arg: index
        };
    }
});

const text = childNode('__textBinder', '<text-node></text-node>');
const block = childNode('__blockBinder', '<!-- block -->', true);

const component = {
    isBlock: true,
    isComponent: true,
    html: '<#: ',
    childIndex: true,
    indexAdjustment: 1,
    name: '',
    init({ index }) {
        return {
            name: '',
            arg: index + 1
        };
    }
};


const attr = binder => ({
    isBlock: false,
    isComponent: false,
    html: '""',
    childIndex: false,
    indexAdjustment: 0,
    name: binder,
    init({ name }) {
        return { 
            name: binder,
            arg: name
        };
    }
});

const attribute = attr('__attrBinder');
const property = attr('__propBinder');

// TODO: rewrite this using acron.
function recurse(ast, declared, undeclared) {
    var ast_fn, ast_fns, declared_copy, i, ids, len;
    if (declared == null) {
        declared = new Set();
    }
    if (undeclared == null) {
        undeclared = new Set();
    }
    ids = new Set();
    ast_fns = [];
    estraverse.traverse(ast, {
        enter: function(node, parent) {
            if (parent != null) {
                if (node.subtemplate) {
                    this.skip();
                }
                else if (node.type === 'Identifier') {
                    if (parent.type === 'VariableDeclarator') {
                        declared.add(node.name);
                    } else if (
                        !parent.key &&
                        (parent.type !== 'MemberExpression' ||
                            node.name !== parent.property.name)
                    ) {
                        ids.add(node.name);
                    }
                }
                else if (
                    node.type === 'FunctionDeclaration' ||
                    node.type === 'FunctionExpression' ||
                    node.type === 'ArrowFunctionExpression'
                ) {
                    ast_fns.push(node);
                    if (node.id != null) {
                        declared.add(node.id.name);
                    }
                    this.skip();
                }
            }
        }
    });
    ids.forEach(function(id) {
        if (!declared.has(id)) {
            undeclared.add(id);
        }
    });
    for ((i = 0), (len = ast_fns.length); i < len; i++) {
        ast_fn = ast_fns[i];
        declared_copy = new Set();
        declared.forEach(function(id) {
            declared_copy.add(id);
        });
        ast_fn.params.forEach(function(param) {
            declared_copy.add(param.name);
        });
        recurse(ast_fn, declared_copy, undeclared);
    }
    return undeclared;
}

function match(ast, scope) {
    if(ast.type === 'Identifier') {
        return scope[ast.name] ? [ast.name] : [];
    }

    const undeclareds = recurse(ast).values();
    
    return Array
        .from(undeclareds)
        .filter(name => scope[name]);
}

class Binder {

    constructor({ sigil = NONE, ast = null, target = text, name = '' } = {}) {        
        this.sigil = sigil;
        this.ast = ast;
        this.target = target;
        
        this.observables = [];
        this.elIndex = -1;
        this.moduleIndex = -1;
        
        this.index = -1;
        this.name = name;
        
        this.properties = [];
    }

    init(el, attr) {
        this.index = el.childIndex;
        this.name = attr;
    }

    get html() {
        return this.target.html;
    }

    get isChildIndex() {
        return this.target.childIndex;
    }

    get childIndex() {
        return this.index + this.target.indexAdjustment;
    }

    get binderName() {
        return this.target.name;
    }

    get declaration() {
        return this.target.init(this);
    }
    
    get declarations() {
        const declarations = [this.declaration];
        if(this.properties) {
            declarations.push(...this.properties.map(p => p.declaration));
        }
        return declarations;
    }

    matchObservables(scope) {
        this.observables = match(this.ast, scope);
    }

    get type() {
        const { sigil, ast, observables } = this;
        const isIdentifier = ast.type === 'Identifier';
        const count = observables.length;

        if(sigil === AT) return SUBSCRIBE;
        if(sigil === NONE || count === 0) return VALUE;
        if(sigil === DOLLAR) {
            if(isIdentifier) return FIRST;
            return (count === 1) ? MAP_FIRST : COMBINE_FIRST;
        }
        if(sigil === STAR) {
            if(isIdentifier) return SUBSCRIBE;
            return (count === 1) ? MAP : COMBINE;
        }
    }
}

function getBinder(options) {

    if(options.sigil === ELEMENT) {
        options.target = component;
    }
    else if (options.inAttributes) {
        if (options.block) {
            throw new Error('Attribute Blocks not yet supported');
        }
        options.target = options.component ? property : attribute;
    }
    else {
        options.target = options.block ? block : text;
    }

    return new Binder(options);
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
    childIndex: -1,
    htmlIndex: -1,
    opened: false,
    component: false,
    binder: null
});

const literalProperty = (name, value) => getBinder({
    name,
    inAttributes: true,
    component: true,
    ast: literal({ value })
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
            const el = currentEl;
            if(el.component) throw new Error('text/html children not yet supported for components');
            
            const childIndex = ++el.childIndex;
            stack.push(el);

            currentEl = getEl(name);
            if(currentEl.component = name === '#:') currentEl.childIndex = childIndex;
            inAttributes = true;
        },
        oncomment(comment) {
            html.push(`<!--${comment}-->`);
            if(currentEl) currentEl.childIndex++;
        },
        onattribute(name, value) {
            currentAttr = name;
            if(name==='oninit') return;
            currentEl.attributes[name] = value;
        },
        onopentag(name) {
            const el = currentEl;
            el.opened = true;
            const { attributes } = el;
            const entries = Object.entries(attributes);

            if(el.component) {
                el.binder.properties = entries.map(([key, value]) => {
                    return typeof value === 'string' ? literalProperty(key, value) : value;
                });
                html.push(`<!-- component start -->`);
            }
            else {                
                // NOTE: html spec and htmlparser2 implementation treat 
                // empty string and valueless attribute as equivalent
                const attrsText = entries.reduce((text$$1, [key, value]) => {
                    return `${text$$1} ${key}="${value}"`;
                },'');

                el.htmlIndex = -2 + html.push(
                    `<${name}${attrsText}`,
                    '',
                    `>`
                );
            }

            currentAttr = null;
            inAttributes = false;
        },
        ontext(text$$1) {
            const el = currentEl;
            if(el.component) {
                if(text$$1.trim()) throw new Error('text/html children not yet supported for components');
            }
            else {
                html.push(text$$1);
                if(el) el.childIndex++;
            }
        },
        add(binder) { 
            const el = currentEl;
            // this works for components, but is misleading
            // because child index in other cases is relative
            // to current el, but for components really is el
            // index of parent el (set in onopentagname)
            binder.init(el, currentAttr || '');

            if(el.component && !el.binder) {
                stack[stack.length - 1].binders.push(binder);
                el.binder = binder;
            }
            else if(el.component) {
                if(inAttributes) {
                    if(!binder.name) throw new Error('Expected binder to have name');
                    this.onattribute(binder.name, binder);
                }
                else {
                    binder.target = property;
                    binder.init(el, 'children');
                    el.binder.properties.push(binder);
                }
            }
            else {
                el.binders.push(binder);
            }
        },
        onclosetag(name) {
            const el = currentEl;
            if(!el.component && !voidElements[name] && el.opened) html.push(`</${name}>`);
            else if(el.component) {
                html.push('<!-- component end -->');
                stack[stack.length - 1].childIndex++;
            }

            currentEl = stack.pop();

            //Notice array of arrays. 
            //Binders from each el are being pushed.
            //Order matters as well because this is how we get 
            //element binding index in right order.

            if(el.binders.length > 0) {
                const target = el.htmlIndex > -1 ? el : currentEl;
                html[target.htmlIndex] = ` data-bind`;
                currentEl.childBinders.push(el.binders);
            }

            if (el.childBinders.length > 0) {
                currentEl.childBinders.push(...el.childBinders);
            }
        },
        onend() {
            // fragment is indexed at the end of the nodes array,
            // which is why its binders go _after_ its child binders
            allBinders = [...fragment.childBinders, fragment.binders];
        }
    };

    var parser = new htmlparser.Parser(handler, { recognizeSelfClosing: true });

    quasis.forEach((quasi, i) => {
        // quasis length is one more than expressions
        if(i === expressions.length) return parser.write(quasi.value.raw);

        const { sigil, text: text$$1 } = getBindingType(quasi.value.raw);

        if(text$$1) parser.write(text$$1);

        let block$$1 = false;
        if(i < quasis.length) {
            const value = quasis[i + 1].value;
            const result = getBlock(value.raw);
            value.raw = result.text;
            block$$1 = result.block;
        }
        
        const binder = getBinder({
            block: block$$1,
            sigil,
            inAttributes,
            component: currentEl.component,
            ast: expressions[i]
        });

        if(!currentEl.component || inAttributes) parser.write(binder.html);
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

function nodeByIndex(elIndex) {
    return memberExpression({
        name: NODES, 
        property: literal({ value: elIndex }), 
        computed: true
    });
}

function childNode$1(binder, index ) {
    if(!binder.isChildIndex) return;

    // const __child${index} = __nodes[${binder.elIndex}].childNodes[${binder.index}];
    return declareConst({
        name: `${CHILD}${index}`,
        init: memberExpression({
            object: memberExpression({
                object: nodeByIndex(binder.elIndex), 
                property: literal({ raw: 'childNodes' }),
            }),            
            property: literal({ value: binder.childIndex }),
            computed: true
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

function binding(binder, i, observer = nodeBinding(binder, i)) {
    const { type, target, properties } = binder;
    const typeBinding = bindings[type];
    const statements = [];
    
    if(target.isBlock || target.isComponent) {
        const id = identifier(`${SUB}${i}b`);
        const init = target.isComponent ? binder.ast : observer;
        const declare = declareConst({ id, init });
        statements.push(declare);

        if(target.isComponent) {
            properties.forEach((p, j) => {
                const selfObserver = componentBinding(p, id);
                statements.push(...binding(p, `${i}_${j}`, selfObserver));
            });
            
            const onanchor = {
                type: 'ExpressionStatement',
                expression: callExpression({
                    callee: memberExpression({
                        object: id,
                        property: identifier('onanchor')
                    }),
                    args: [literal({ raw: `${CHILD}${i}` })]
                })
            }; 
            statements.push(onanchor);
        }
        else {
            observer = memberExpression({
                object: id,
                property: identifier('observer')
            });
            statements.push(typeBinding(observer, binder, i));
        }
    }
    else {
        statements.push(typeBinding(observer, binder, i));
    }

    return statements;
}

function nodeBinding(binder, index) {
    if(binder.isChildIndex) {
        // ${binder.binderName}(__child${index})
        return callExpression({
            name: binder.binderName, 
            args: [
                literal({ raw: `${CHILD}${index}` })
            ]
        });
    }
    // ast => ast(__nodes[0]) 
    else if(binder.name === 'oninit') {
        const oninit = identifier('oninit');
        return arrowFunctionExpression({ 
            body: callExpression({
                callee: oninit,
                args: [nodeByIndex(binder.elIndex)]
            }),
            params: [oninit]
        });
    } 
    else {
        // ${binder.binderName}(__nodes[${elIndex}], ${binder.name})
        return callExpression({
            name: binder.binderName, 
            args: [
                nodeByIndex(binder.elIndex),
                literal({ value: binder.name })
            ]
        });
    }
}

// ${binderName}(${name}, <identifier>)
function componentBinding({ binderName, name }, componentIdentifier) {
    return callExpression({
        name: binderName, 
        args: [
            componentIdentifier,
            literal({ value: name })            
        ]
    });
}

// <nodeBinding>(<ast>);
function valueBinding(nodeBinding, binder) {
    const { ast } = binder;

    return {
        type: 'ExpressionStatement',
        expression: callExpression({
            callee: nodeBinding,
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
function subscribeBinding(nodeBinding, binder, index) {
    const { ast } = binder;

    return subscription(
        index, 
        callExpression({
            callee: memberExpression({ 
                object: ast, 
                property: identifier('subscribe')
            }),
            args: [nodeBinding]
        }) 
    );
}

// const __sub${binderIndex} = __first(observable, <nodeBinding>);
function firstBinding(nodeBinding, binder, binderIndex) {
    const { observables: [ name ] } = binder;
    const observable = identifier(name);
    const args = [
        observable, 
        nodeBinding
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

function mapFirstBinding(nodeBinding, binder, binderIndex) {
    return mapBinding(nodeBinding, binder, binderIndex, true);
}

// const __sub${binderIndex} = __map(observable, observable => (<ast>), <nodeBinding> [, true]);
function mapBinding(nodeBinding, binder, binderIndex, firstValue = false) {
    const { ast, observables: [ name ] } = binder;
    const observable = identifier(name);
    const args = [
        observable, 
        arrowFunctionExpression({ 
            body: ast,
            params: [observable]
        }),
        nodeBinding
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

function combineFirstBinding(nodeBinding, binder, binderIndex) {
    return combineBinding(nodeBinding, binder, binderIndex, true);
}

// const __sub${binderIndex} = __combine([o1, o2, o3], (o1, o2, o3) => (<ast>), <nodeBinding> [, true]);
function combineBinding(nodeBinding, binder, binderIndex, firstValue = false) {
    const { ast, observables } = binder;
    const params = observables.map(identifier);
    const args =  [
        arrayExpression({ elements: params }), 
        arrowFunctionExpression({ 
            body: ast,
            params
        }),
        nodeBinding
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

// const __nodes = __render${index}();
const renderNodes = index => {
    return declareConst({ 
        name: NODES, 
        init: callExpression({ 
            callee: identifier(`${RENDER}${index}`)
        })
    });
};

const templateToFunction = (node, block) => {
    const ast = arrowFunctionExpression({ block });
    Object.assign(node, ast);
};

const makeTemplateStatements = ({ binders, index }) => {
    const childNodes = binders
        .map((b, i) => childNode$1(b, i))
        .filter(c => c);

    const bindings = binders
        // binding takes additional params, so we can't directly pass to map
        .map((b, i) => binding(b, i))
        .reduce((a, b) => a.concat(b), []);
        
    return [
        renderNodes(index),
        ...childNodes,
        ...bindings,
        ...fragment(binders)
    ];
};

const TAG = '_';
const OTAG = '$';
const MODULE_NAME = 'azoth';

class Module {
    constructor({ tag = TAG, oTag = OTAG } = {}) {
        this.name = MODULE_NAME;
        // imports may modify tag and oTag based on found imports
        this.imports = new Imports({ tag, oTag });
        this.fragments = new UniqueStrings();
        this.binders = new UniqueStrings();
        
        // track scope and current function
        this.scope = this.functionScope = Object.create(null);
        this.currentFn = null;
        this.currentReturnStmt = null;

        //track added statements
        this.statements = null;
        
        // all purpose module-wide 
        // ref counter for destructuring
        let ref = 0;
        this.getRef = () => `__ref${ref++}`;
    }

    get tag() {
        return this.imports.tag;
    }

    get oTag() {
        return this.imports.oTag;
    }

    addStatements(statements, index = 0) {
        if(!this.statements) this.statements = [];
        this.statements.push({ statements, index });
    }

    flushStatements(node, options) {
        if(!this.statements) return;
        addStatementsTo(node, this.statements, options);
        this.statements = null;
    }

    addDeclarations(body) {
        const { fragments } = this;

        body.splice(0, 0, ...fragments.keys.map(renderer));
    }

    // only used privately from makeTemplate
    addBinder(binder) {

        binder.matchObservables(this.scope);
        this.imports.addBinder(binder);

        const { declarations } = binder;
        let index = -1;
        declarations.forEach((d, i) => {
            const unique = JSON.stringify(d);
            const at = this.binders.add(unique, d);
            if(i === 0) index = at;
        });
        binder.moduleIndex = index;
        binder.properties.forEach(p => this.addBinder(p));
    }

    makeTemplate(node) {
        const { html, binders } = parseTemplate(node.quasi);
        const index = this.fragments.add(html);
         
        binders.forEach(b => this.addBinder(b));
        
        const statements = makeTemplateStatements({ binders, index });
        statements.forEach(node => node.subtemplate = true);
        
        // TODO: this.currentFn gets set by the observables handlers
        // (currentReturnStmt gets set by templates handlers),
        // which means this is coupled those set of handlers.
        const { currentFn, currentReturnStmt } = this;
        if(currentFn) {
            if(currentFn.body === node) {
                addStatementsTo(currentFn, [{ statements, index: 0 }]);
                currentFn.subtemplate = true;
            }
            else if(currentReturnStmt && currentReturnStmt.argument === node) {
                replaceStatements(currentFn.body.body, currentReturnStmt, statements);
            }
        } 
        
        if(!currentFn.subtemplate) node.subtemplate = true;

        templateToFunction(node, statements);
    }
}

const ACORN_DEFAULTS = {
    ecmaVersion: 8,
    sourceType: 'module'
};

function parse$1(source, options) {
    return parse(source, Object.assign({}, ACORN_DEFAULTS, options));
}

const ASTRING_DEFAULTS = { 
    ident: '    '
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
    module.currentFn = node;
    c(node, module, 'BlockStatement');
    module.addDeclarations(node.body);
};

const ImportDeclaration = ({ source, specifiers }, { name, imports }) => {
    if(!source.value.endsWith(name)) return;
    imports.specifiers = specifiers;
};

const ReturnStatement = (node, module, c) => {
    const prior = module.currentReturnStmt;
    module.currentReturnStmt = node;
    base.ReturnStatement(node, module, c);
    module.currentReturnStmt = prior;
};

var templates = Object.freeze({
	TaggedTemplateExpression: TaggedTemplateExpression,
	Program: Program,
	ImportDeclaration: ImportDeclaration,
	ReturnStatement: ReturnStatement
});

const property$1 = identifier('child');
const initChild = ({ ref: object, arg }) => callMethod({ object, property: property$1, arg });

function destructureObservables({ newRef, sigil='$' }) {

    return function destructure(node, ref) {
        const observables = [];
        const statements = [];

        const addStatement = ({ node: id, init }) => {
            statements.push(declareConst({ id, init })); 
        };

        const makeRef = init => {
            const ref = newRef();
            addStatement({ node: ref, init });
            return ref;
        };

        recursive(node, { ref }, {
            Property({ computed, key, value }, { ref }, c) {
                const arg = computed ? key : literal({ value: key.name });
                c(value, { ref, arg }, 'Child');
            },

            Child(node, { ref, arg }, c) {
                const init = initChild({ ref, arg });
                c(node, { ref, init });
            },

            Identifier(node, { init }) {
                addStatement({ node, init });
                observables.push(node.name);
            },

            ObjectPattern(node, { ref, init }, c) {
                if(init) ref = makeRef(init);
                node.properties.forEach(p => c(p, { ref }));
            },

            ArrayPattern(node, { ref, init }, c) {
                if(init) ref = makeRef(init);
                node.elements.forEach((el, i) => {
                    if(!el) return;
                    const arg = literal({ value: i, raw: i });
                    c(el, { ref, arg }, 'Child');
                });
            },

            AssignmentPattern(node, state, c) {
                if(node.right.name === sigil) {
                    throw new Error(`Cannot "${ sigil }" twice in same destructuring path`);
                }
                base.AssignmentPattern(node, state, c);
            }        
        });

        return { statements, observables };
    };
}

function recursiveReplace(node, state, visitors) {
    function c(node, state){
        const found = visitors[node.type];
        return found ? found(node, state, c) : node;
    }
    return c(node, state);
}

function makeObservablesFrom({ getRef, newRef= () => identifier(getRef()), sigil='$' }) {

    const destructure = destructureObservables({ newRef, sigil });

    return function observablesFrom(ast, state) {

        return recursiveReplace(ast, state, {
            AssignmentPattern(node, state, c) {
                const { left, right } = node;
                
                if(right.name !== sigil) {
                    // TODO: could be more to do `left` (templates, expression functions, etc)
                    return {
                        type: 'AssignmentPattern',
                        left: c(left, state),
                        right: c(right, state)
                    };
                }

                if(left.type === 'Identifier') {
                    state.addObservable(left.name);
                    return left;
                }
                
                if(left.type === 'ObjectPattern' || left.type === 'ArrayPattern') {
                    const ref = newRef();
                    const { statements, observables } = destructure(left, ref);
                    state.addStatements(statements);
                    observables.forEach(state.addObservable);
                    return ref;
                }
            },

            ObjectPattern(node, state, c) {
                node.properties.forEach(p => p.value = c(p.value, state));
                return node;
            },

            ArrayPattern(node, state, c) {
                node.elements = node.elements.map(el => c(el, state));
                return node;
            },

            Identifier(node, state) {
                state.addIdentifier(node.name);
                return node;
            }
            
        }) || ast;
    };
}

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

function createHandlers({ getRef, sigil='$' }) {
    const newRef = () => identifier(getRef());
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

function compile(source) {
    const ast = parse$1(source);
    astTransform(ast);
    return generate$1(ast);
}

function astTransform(ast) {
    const module = new Module();
    // TODO: preflight imports in own walker so we have the right specifiers
    const observables = createHandlers({ getRef() { return module.getRef(); } });
    const handlers = Object.assign({}, templates, observables);
    recursive(ast, new Module(), handlers);
}

export default compile;
