'use strict';

require('source-map-support').install();

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var astring = require('astring');
var chai = require('chai');
var chai__default = _interopDefault(chai);
var acorn = require('acorn');
var acorn_dist_walk = require('acorn/dist/walk');
var htmlparser = _interopDefault(require('htmlparser2'));
var undeclared = _interopDefault(require('undeclared'));
var MagicString = _interopDefault(require('magic-string'));

const VALUE = Symbol('value');
const MAP = Symbol('map');
const SUBSCRIBE = Symbol('subscribe');

class Binder {

    constructor({ type = VALUE, ast = null } = {}, target) {        
        this.type = type;
        this.params = null;
        this.ast = ast;
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

    writeHtml() {
        return this.target.html;
    }

    writeInit() {
        return this.target.init(this);
    }

    writeImport() {
        return this.target.import;
    }

    get isSubscriber() {
        const { type, params } = this;
        return (type === SUBSCRIBE || (!!params && params.length > 0));
    }

    writeBinding(observer) { 
        const { ast, params, type } = this;
        const isIdentifier = ast.type === 'Identifier';

        const expr = isIdentifier ? ast.name : astring.generate(ast);
        if ((!params || !params.length) && type !== SUBSCRIBE) {
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
                observable = params.join();
                const map = `(${observable}) => (${expr})`;

                if (params.length > 1) {
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

const assert$1 = chai__default.assert;

describe('binder factory', () => {

    describe('binding type', () => {
        it('passes thru', () => {
            const binder = getBinder({ inAttributes: false, block: false, type: 'value' });
            assert$1.equal(binder.type, 'value');
        });
    });

    describe('element child', () => {
        it('text binder', () => {
            const binder = getBinder({ inAttributes: false, block: false });
            assert$1.instanceOf(binder, ChildNodeBinder);
            assert$1.equal(binder.target, text);
        });

        it('block binder', () => {
            const binder = getBinder({ inAttributes: false, block: true });
            assert$1.instanceOf(binder, ChildNodeBinder);
            assert$1.equal(binder.target, block);
        });
    });  

    describe('element attribute', () => {
        it('attribute binder', () => {
            const binder = getBinder({ inAttributes: true, block: false });
            assert$1.instanceOf(binder, AttributeBinder);
            assert$1.equal(binder.target, attribute);
        });

        it('attribute block binder not yet supported', () => {
            assert$1.throws(() => getBinder({ inAttributes: true, block: true }), /not yet supported/);
        });
    });

});

/*eslint no-undef: off */
const assert$2 = chai__default.assert;

describe('Binder', () => {

    it('elIndex and moduleIndex default to -1', () => {
        assert$2.equal(new Binder().elIndex, -1);
        assert$2.equal(new Binder().moduleIndex, -1);
    });

    it('isSubscriber', () => {
        assert$2.isFalse(new Binder({ type: 'value' }).isSubscriber);
        assert$2.isFalse(new Binder({ type: 'observer' }).isSubscriber);
        assert$2.isFalse(new Binder({ type: 'observable' }).isSubscriber);
    });

    describe('target', () => {

        it('ChildBinder init', () => {
            const childBinder = new ChildNodeBinder({});
            childBinder.init({ childIndex: 2 });
            assert$2.equal(childBinder.index, 2);
        });

        it('AttributeBinder init', () => {
            const attrBinder = new AttributeBinder({});
            attrBinder.init({}, 'name');
            assert$2.equal(attrBinder.name, 'name');
        });

        it('writes', () => {
            const writer = {
                html: 'html',
                import: '__import',
                init: binder => binder.foo
            };

            const binder = new Binder({}, writer);
            binder.foo = 'FOO';
            
            assert$2.equal(binder.writeHtml(), writer.html);
            assert$2.deepEqual(binder.writeImport(), writer.import);
            assert$2.equal(binder.writeInit(), 'FOO');
        });
    });
    
    describe.skip('binding', () => {

        const OBSERVER = '<observer>';

        // TODO: .distinctUntilChanged()
        
        it('value identifier', () => {
            const source = () => foo;
            const binder = new Binder({ ast: source.toExpr() });
            binder.params = ['foo'];

            const binding = binder.writeBinding(OBSERVER);
            const expected = `foo.first().subscribe(${OBSERVER})`;
            
            assert$2.equal(binding, expected);
        });

        it('value expression with single param', () => {
            const source = () => foo + bar;
            const binder = new Binder({ ast: source.toExpr() });
            binder.params = ['foo'];

            const binding = binder.writeBinding(OBSERVER);
            const expected = `foo.map((foo) => (foo + bar)).first().subscribe(${OBSERVER})`;
            
            assert$2.equal(binding, expected);
        });

        it('value expression with multiple params', () => {
            const source = () => foo + bar;
            const binder = new Binder({ ast: source.toExpr() });
            binder.params = ['foo', 'bar'];

            const binding = binder.writeBinding(OBSERVER);
            const expected = `combineLatest(foo,bar, (foo,bar) => (foo + bar)).first().subscribe(${OBSERVER})`;
            
            assert$2.equal(binding, expected);
        });

        it('map identifier', () => {
            const source = () => foo;
            const binder = new Binder({ ast: source.toExpr(), type: MAP });
            binder.params = ['foo'];

            const binding = binder.writeBinding(OBSERVER);
            const expected = `foo.subscribe(${OBSERVER})`;
            
            assert$2.equal(binding, expected);
        });

        it('subscribe identifier', () => {
            const source = () => foo.map(foo => foo + 1);
            const binder = new Binder({ ast: source.toExpr(), type: SUBSCRIBE });
            binder.params = ['foo'];

            const binding = binder.writeBinding(OBSERVER);
            const expected = `(foo.map(foo => foo + 1)).subscribe(${OBSERVER})`;
            
            assert$2.equal(binding, expected);
        });

        it('no params', () => {
            const source = () => 1 + 2;
            const binder = new Binder({ ast: source.toExpr() });
            binder.params = [];
            
            const binding = binder.writeBinding(OBSERVER);
            const expected = `${OBSERVER}(1 + 2)`;
            
            assert$2.equal(binding, expected);
        });

        it('static expression, no params', () => {
            const source = () => x  + y;
            const binder = new Binder({ ast: source.toExpr() });
            binder.params = [];
            
            const binding = binder.writeBinding(OBSERVER);
            const expected = `${OBSERVER}(x + y)`;
            
            assert$2.equal(binding, expected);
        });
    });
});

const assert$3 = chai__default.assert;

describe('binder targets', () => {

    it('text', () => {
        assert$3.equal(text.html, '<text-node></text-node>');
        assert$3.equal(text.import, '__textBinder');
        assert$3.equal(text.init({ index: 2 }), 2);
    });

    it('block', () => {
        assert$3.equal(block.html, '<block-node></block-node>');
        assert$3.equal(block.import, '__blockBinder');
        assert$3.equal(block.init({ index: 2 }), 2);
    });

    it('attribute', () => {
        assert$3.equal(attribute.html, '""');
        assert$3.equal(attribute.import, '__attrBinder');
        assert$3.equal(attribute.init({ name: 'name' }), 'name');
    });
});

const DEFAULTS = {
    ecmaVersion: 8,
    sourceType: 'module'
};

function ast(source, options) {
    return acorn.parse(source, Object.assign({}, DEFAULTS, options));
}

const assert$4 = chai__default.assert;

const stripParse = code => {
    const ast$$1 = ast(code);
    return astring.generate(ast$$1, { indent: '    ' });
};

const tryParse = (name, code) => {
    try {
        return stripParse(code);
    }
    catch (err) {
        console.log('FAILED PARSE:', name, '\nERROR:', err, '\nCODE:\n', code);
        throw err;
    }
};

function codeEqual(actual, expected) {
    if(typeof expected !== 'string') expected = expected.toCode();
    const parsedActual = tryParse('actual', actual);
    const parsedExpected = tryParse('expected', expected);
    assert$4.equal(parsedActual, parsedExpected);
}

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

class Globals {
    constructor() {
        this._imports = new UniqueStrings();
        this._binders = new UniqueStrings();
        this._fragments = new UniqueStrings();
        this.tag = TAG;
        this.specifiers = null;
    }

    get imports() { return this._imports.all; }
    get binders() { return this._binders.values; }
    get fragments() { return this._fragments.all; }

    addFragment(html) {
        return this._fragments.add(html);
    }

    addBinder(binder) {
        const name = binder.writeImport();
        const arg = binder.writeInit();
        const value = { name, arg };
        const unique = JSON.stringify(value);
        
        this._imports.add(name);
        return this._binders.add(unique, value);
    }
}

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

function parseTemplate$1({ expressions, quasis }) {

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
const arrowFunctionExpression = body => ({
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
            right: arrowFunctionExpression(unsubscribes)
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

// const __sub${binderIndex} = <ast>.subscribe(<nodeBinding>);
const subscribeBinding = (binder, binderIndex) => {
    const { ast, moduleIndex, elIndex } = binder;

    return declareConst({
        name: `${SUB}${binderIndex}`, 
        init: callExpression({
            callee: memberExpression({ 
                object: ast, 
                property: identifier('subscribe')
            }),
            args: [nodeBinding(moduleIndex, elIndex)]
        }) 
    });
};

var binding = (binder, i) => {
    switch(binder.type) {
        case VALUE:
            return valueBinding(binder, i);
        case SUBSCRIBE:
            return subscribeBinding(binder, i);
        default:
            throw new Error(`Unsupported binding type ${binder.type}`);
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
    return arrowFunctionExpression(statements);
};

const TTEtoAFE = (node, AFE) => {
    node.type = 'CallExpression',
    node.callee = AFE;
};

const renderer$1 = (html, index) =>{
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

function compile(source) {
    const ast$$1 = ast(source);

    acorn_dist_walk.simple(ast$$1, {
        TaggedTemplateExpression(node, globals) {
            if (node.tag.name !== globals.tag) return;
            const { html, binders } = parseTemplate$1(node.quasi);
            const index = globals.addFragment(html);
            binders.forEach(b => b.moduleIndex = globals.addBinder(b));
            
            const newAst = templateAFE({ binders, index });
            TTEtoAFE(node, newAst);
        },
        Program({ body }, { fragments, binders, imports, specifiers }) {
            body.splice(0, 0, 
                ...fragments.map(renderer$1), 
                ...binders.map(initBinder));

            if(specifiers) {
                const binderImports = imports.map(name => specifier(name));
                specifiers.push(...binderImports);
            }
        },
        ImportDeclaration({ source, specifiers }, globals) {
            if(!source.value.endsWith(MODULE_NAME)) return;
            
            globals.specifiers = specifiers;
            const imports = [RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT].map(specifier);
            specifiers.push(...imports);
            
            const index = specifiers.findIndex(({ imported }) => imported.name === SPECIFIER_NAME); 
            if(index > -1) {
                globals.tag = specifiers[index].local.name;
                specifiers.splice(index, 1);
            }
        }

    }, acorn_dist_walk.base, new Globals());

    return astring.generate(ast$$1);
}

describe('compiler', () => {

    it('hello world', () => {
        const source = `
            import { html as _ } from 'diamond';
            const template = name => _\`<span>Hello \${name}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __bind0 = __textBinder(1);
            import { renderer, makeFragment, __textBinder } from 'diamond';
            const template = name => (() => {
                const __nodes = __render0();
                __bind0(__nodes[0])(name);
                return __nodes[__nodes.length];
            })();
        `;

        codeEqual(compiled, expected);
    }); 

    /*eslint no-unused-vars: off */
    /* globals _ */
    it('no import', () => {
        function source() {
            const template = name => _`<span>Hello ${name}</span>`;
        }

        const compiled = compile(source.toCode());

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __bind0 = __textBinder(1);
            const template = name => (() => {
                const __nodes = __render0();
                __bind0(__nodes[0])(name);
                return __nodes[__nodes.length];
            })();
        `;

        codeEqual(compiled, expected);
    });

    it('nested', () => {
        const source = `
            import { html as _ } from 'diamond';
            const template = (foo , bar) => _\`<div>\${ foo ? _\`<span>Hello \${bar}</span>\` : _\`<span>Goodbye \${bar}</span>\`}</div>\`;
        `;
        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __render1 = renderer(makeFragment(\`<span data-bind>Goodbye <text-node></text-node></span>\`));
            const __render2 = renderer(makeFragment(\`<div data-bind><text-node></text-node></div>\`));
            const __bind0 = __textBinder(1);
            const __bind1 = __textBinder(0);
            import { renderer, makeFragment, __textBinder } from 'diamond';
            const template = (foo, bar) => (() => {
                const __nodes = __render2();
                __bind1(__nodes[0])(foo ? (() => {
                    const __nodes = __render0();
                    __bind0(__nodes[0])(bar);
                    return __nodes[__nodes.length];
                })() : (() => {
                    const __nodes = __render1();
                    __bind0(__nodes[0])(bar);
                    return __nodes[__nodes.length];
                })());
                return __nodes[__nodes.length];
            })();
        `;

        codeEqual(compiled, expected);
    });

  

});

const assert$5 = chai__default.assert;
describe('Map By String Collection', () => {

    const collection = new UniqueStrings();

    it('returns new index on add', () => {
        assert$5.equal(collection.add('some string'), 0);
        assert$5.equal(collection.add('another string'), 1);
    });

    it('returns index of previous string', () => {
        assert$5.equal(collection.add('some string'), 0);
        assert$5.equal(collection.add('another string'), 1);
    });

    it('and does new strings again', () => {
        assert$5.equal(collection.add('new one'), 2);
    });

    it('returns all as array', () => {
        assert$5.deepEqual(collection.all, [
            'some string',
            'another string',
            'new one',
        ]);
    });
});

const MODULE_NAME$1 = 'diamond';
const SPECIFIER_NAME$1 = 'html';

function findImport(ast) {
    let specifier = null;
    acorn_dist_walk.recursive(ast, {}, {
        ImportDeclaration(node) {
            // TODO: expose as config so we don't have this weakish test
            if(!node.source.value.endsWith(MODULE_NAME$1)) return;
            specifier = node.specifiers.find(({ imported }) => imported.name === SPECIFIER_NAME$1);
        }
    });
    return specifier;
}

// TODO: manage scope if needed via ancestor walk
// stack is maintained by acorn on future calls, 
// so we make a copy to preserve current stack, 
// and also exclude _this_ node from own ancestor stack
// const ancestors = currentAncestors.slice(0, -1);

const TAG$1 = '_';

function findTemplates(ast, { tag = TAG$1 } = {}) {
    const templates = [];
    
    acorn_dist_walk.simple(ast, {
        TaggedTemplateExpression(node, st) {
            if (node.tag.name !== tag) return;
            st.push(node);
        },

    }, acorn_dist_walk.base, templates);

    return templates;
}

const isFn = /function/i;

function findParams(ancestors) {

    let i = ancestors.length - 1;
    let node = null;
    while(node = ancestors[i--]) {
        if(isFn.test(node.type)) {
            const { params } = node;
            const identifiers = getIdentifiers(params);
            return {
                identifiers,
                params
            };
        }
    }

    return { 
        identifiers: [],
        params: []
    };
}

//TODO: Can I use acorn walker for this?
function getIdentifiers(params) {
    const identifiers = [];

    const types = {
        Identifier: value => identifiers.push(value.name),
        Property: value => getByType(value.value),
        ObjectPattern: value => getProperties(value.properties)
    };
    const getProperties = list => list.forEach(getByType);
    const getByType = value => types[value.type](value);

    getProperties(params);
    
    return identifiers;
}

function getObservables(ast, identifiers) {
    return Array
        .from(undeclared(ast).values())
        .filter(name => false /*identifiers.has(name)*/);
}

function parse$1(ast, { tag, index = 0 /*, identifiers: parentIdentifiers*/ } = {}) {
    
    return findTemplates(ast, { tag }).map((node, templateIndex) => {

        const position = { start: node.start, end: node.end };
        const { html, binders } = parseTemplate$1(node.quasi);
        replaceTemplateWithIdentifier(node, index, templateIndex);
        
        // const { params, identifiers: current } = findParams(ancestors);
        // const identifiers = combine(parentIdentifiers, current);

        const recurse = (ast, index) => parse$1(ast, { tag, /* identifiers,*/ index });

        binders.forEach((binder, i) => {
            binder.templates = recurse(binder.ast, i);
            // binder.params = matchObservables(binder.ast, identifiers);
        });

        return { html, binders/*, params*/, position, node };

    });
}

// function combine(parent, child) {
//     if (parent === undefined) return new Set(child);
//     return new Set([...parent, ...child]);
// }

function replaceTemplateWithIdentifier(node, binderIndex, templateIndex) {
    node.type = 'Identifier',
    node.name = `__t${binderIndex}_${templateIndex}`;
    delete node.tag;
    delete node.quasi;
    delete node.start;
    delete node.end;
}

function compile$2({ html, binders: b, params: p }, globals = new Globals()) {
    const renderIndex = globals.addFragment(html);
    b.forEach(binder => {
        binder.moduleIndex = globals.addBinder(binder);
    });

    // const recurse = template => compile(template, globals);

    return schema({
        // params: params(p),
        render: render(renderIndex),
        // subtemplates: subtemplates(b, recurse),
        bindings: bindings(b),
        unsubscribes: unsubscribes$1(b)
    });
}

const indent = '    ';

function schema({ render, bindings, unsubscribes, subtemplates = [] }) {
    const template = (
`((() => {
    const __nodes = ${render};${
    subtemplates.length ? `
    ${subtemplates
        .map(template => {
            const firstLineIndex = template.indexOf('\n');
            return new MagicString(template)
                .indent(indent.repeat(2), { 
                    exclude: [0 , firstLineIndex]
                })
                .toString();
        })
        .join('\n' + indent.repeat(2))}`
    : ''}${
    bindings.length ? `
    ${bindings.join('\n' + indent.repeat(2))}`
    : ''}${
    unsubscribes.length ? `
    const __fragment = __nodes[__nodes.length];
    __fragment.unsubscribe = () => {
        ${unsubscribes.join('\n' + indent.repeat(3))}
    };
    return __fragment;`
    : `
    return __nodes[__nodes.length];`}
})())`);

    return template;
}

function render(index) {
    return `__render${index}()`;
}




function binders(binders) {
    return binders.map(binder => {
        return `const __bind${binder.moduleIndex} = ${binder.writeInit()};`;
    });
}

function bindings(binders) {
    return binders.map((binder, i) => {
        const subscriber = binder.isSubscriber ? `const __sub${i} = ` : '';
        const observer = `__bind${binder.moduleIndex}(__nodes[${binder.elIndex}])`;
        return `${subscriber}${binder.writeBinding(observer)};`;
    });
}

function subtemplates(binders, compile) {
    return binders.reduce((templates, binder, iBinder) => {
        return templates.concat(binder.templates.map((template, i) => {
            return `const __t${iBinder}_${i} = ${compile(template)}`;
        }));
    }, []);
}

function unsubscribes$1(binders) {
    return binders
        // map first because we need to preserve original index
        .map((binder, i) => {
            if (!binder.isSubscriber) return;
            return `__sub${i}.unsubscribe();`;
        })
        .filter(unsub => unsub);
}

function compile$1(source) {
    const s = new MagicString(source);
    const ast$$1 = ast(source);

    const specifier = findImport(ast$$1);
    const options = specifier ? { tag: specifier.local.name } : {};

    const templates = parse$1(ast$$1, options);
    console.log('TEMPLATES', templates.length);

    const globals = new Globals();
    templates.forEach(template => {
        const compiled = compile$2(template, globals);
        const { start, end } = template.position;
        s.overwrite(start, end, compiled);
    });

    const { imports, fragments, binders: binders$$1 } = globals;

    if (specifier) {
        const allImports = ['renderer', 'makeFragment', ...imports];
        s.overwrite(specifier.start, specifier.end, allImports.join());
    }
    
    const initRenderers = fragments.map((html, i) => 
        `const __render${i} = renderer(makeFragment(\`${html}\`));`
    );

    const initBinders =  binders$$1.map((binder, i) => {
        return `const __bind${i} = ${binder};`;
    });

    const toPrepend = [...initRenderers, ...initBinders].join('\n') + '\n';

    s.prepend(toPrepend);

    return s.toString();
}

/*globals _, makeFragment, renderer, __textBinder, __blockBinder, combineLatest */
/*eslint semi: off */

// import chai from 'chai';
// const assert = chai.assert;


describe.skip('compiler', () => {

    it('adds to import', () => {
        const code = compile$1(`
            import { html as _ } from 'diamond';
            const template = foo => _\`@\${foo}\`;
        `);

        codeEqual(code, `
            const __render0 = renderer(makeFragment(\`<text-node></text-node>\`));
            const __bind0 = __textBinder(0);
            import { renderer, makeFragment, __textBinder } from 'diamond';
            const template = foo => (() => {
                const __nodes = __render0();
                const __sub0 = foo.subscribe(__bind0(__nodes[0]));
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                    __sub0.unsubscribe();
                };
                return __fragment;
            })();`
        );

    });

    it('compiles template with observer text nodes', () => {
        function template() {
            (foo, place) => _`@${foo}<span>hello @${place}</span>@${place}`;
        }

        const code = compile$1(template.toCode());

        codeEqual(code, expected);

        function expected() {
            const __render0 = renderer(makeFragment(`<text-node></text-node><span data-bind>hello <text-node></text-node></span><text-node></text-node>`));
            const __bind0 = __textBinder(1);
            const __bind1 = __textBinder(0);
            const __bind2 = __textBinder(2);
            (foo, place) => (() => {
                const __nodes = __render0();
                const __sub0 = place.subscribe(__bind0(__nodes[0]));
                const __sub1 = foo.subscribe(__bind1(__nodes[1]));
                const __sub2 = place.subscribe(__bind2(__nodes[1]));
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                    __sub0.unsubscribe();
                    __sub1.unsubscribe();
                    __sub2.unsubscribe();
                };
                return __fragment;
            })();
        }

    });

    it('compiles static expression', () => {
        function template() {
            (x, y) => _`${x} + ${y} = ${x + y}`;
        }

        const code = compile$1(template.toCode());

        codeEqual(code, expected);

        function expected() {
            const __render0 = renderer(makeFragment(`<text-node></text-node> + <text-node></text-node> = <text-node></text-node>`));
            const __bind0 = __textBinder(0);
            const __bind1 = __textBinder(2);
            const __bind2 = __textBinder(4);
            (x, y) => (() => {
                const __nodes = __render0();
                __bind0(__nodes[0])(x);
                __bind1(__nodes[0])(y);
                __bind2(__nodes[0])(x + y);
                return __nodes[__nodes.length];
            })();
        }

    });
});

Function.prototype.toCode = function() {
    const trimmed = this.toString().trim();
    const length = trimmed.length;

    const tryBlockArrow = trimmed.replace(/^\(\) => {/, '');
    if(tryBlockArrow.length !== length) {
        
        return tryBlockArrow
            .slice(0,-1)
            .trim();
    }

    const tryArrow = trimmed.replace(/^\(\) => /, '');
    if(tryArrow.length !== length) {
        return tryArrow.trim();
    }

    return trimmed
        .replace(`function ${this.name}() {`, '')
        .slice(0,-1)
        .trim();
};

Function.prototype.toAst = function() {
    return ast(this.toCode());
};

Function.prototype.toExpr = function () {
    return this.toAst().body[0].expression; 
};

/*eslint no-undef: off, no-unused-vars: off */
const assert$6 = chai__default.assert;

describe.skip('compile template', () => {

    describe('integration (full template)', () => {

        const parseTemplates = source => parse$1(source.toAst());

        it('simple', () => {

            function source() {
                const template = name => _`<span>Hello ${name}</span>`;
            }

            const [ template ] = parseTemplates(source);
            const compiled = compile$2(template);

            codeEqual(compiled, expected);

            function expected() {
                (() => {
                    const __nodes = __render0();
                    __bind0(__nodes[0])(name);
                    return __nodes[__nodes.length];
                })();
            }
        });

        it.skip('nested only work on one template at a time', () => {

            function source() {
                const template = () => _`<span>${foo ? _`one` : _`two`}${_`three ${_`four`}`}</span>`;
            }

            const [ template ] = parseTemplates(source);
            const compiled = compile$2(template);

            codeEqual(compiled, expected);

            function expected() {
                (() => {
                    const __nodes = __render0();
                    const __t0_0 = (() => {
                        const __nodes = __render1();
                        return __nodes[__nodes.length];
                    })();
                    const __t0_1 = (() => {
                        const __nodes = __render2();
                        return __nodes[__nodes.length];
                    })();
                    __bind0(__nodes[0])(foo ? __t0_0 : __t0_1);
                    __bind1(__nodes[0])((() => {
                        const __nodes = __render3();
                        const __t0_0 = (() => {
                            const __nodes = __render4();
                            return __nodes[__nodes.length];
                        })();
                        __bind1(__nodes[0])(__t0_0);
                        return __nodes[__nodes.length];
                    })());
                    return __nodes[__nodes.length];
                })();
            }
        });
    });

    describe('schema', () => {

        it('all', () => {
            const binders$$1 = ['binder1;', 'binder2;'];
            const params$$1 = {
                params: ['param1', 'param2'],
                destructure: ['destructure1;', 'destructure2;']
            };
            const render$$1 = 'render0';
            const bindings$$1 = ['bindings1;', 'bindings2;'];
            const unsubscribes = ['unsubscribe1;', 'unsubscribe1;'];

            const template = schema({ binders: binders$$1, params: params$$1, render: render$$1, bindings: bindings$$1, unsubscribes });
            codeEqual(template, expected);

            function expected() {
                (() => {
                    const __nodes = render0;
                    bindings1;
                    bindings2;
                    const __fragment = __nodes[__nodes.length];
                    __fragment.unsubscribe = () => {
                        unsubscribe1;
                        unsubscribe1;
                    };
                    return __fragment;
                })();
            }
        });

        it('no destructure or unsubscribe', () => {
            const binders$$1 = ['binder1;', 'binder2;'];
            const params$$1 = {
                params: ['param1', 'param2'],
                destructure: []
            };
            const render$$1 = 'render0';
            const bindings$$1 = ['bindings1;', 'bindings2;'];
            const unsubscribes = [];

            const template = schema({ binders: binders$$1, params: params$$1, render: render$$1, bindings: bindings$$1, unsubscribes });
            codeEqual(template, expected);
            
            function expected() {
                (() => {
                    const __nodes = render0;
                    bindings1;
                    bindings2;
                    return __nodes[__nodes.length];
                })();
            }
        });

        it('minimal', () => {
            const binders$$1 = [];
            const params$$1 = {
                params: [],
                destructure: []
            };
            const render$$1 = 'render0';
            const bindings$$1 = [];
            const unsubscribes = [];

            const template = schema({ binders: binders$$1, params: params$$1, render: render$$1, bindings: bindings$$1, unsubscribes });
            codeEqual(template, expected);

            function expected() {
                (() => {
                    const __nodes = render0;
                    return __nodes[__nodes.length];
                })();
            }
        });
    });


    // TODO: move to module
    describe.skip('binders', () => {

        function getBinder(target, childIndex, name) {
            const binder = new Binder({}, target);
            binder.init({ childIndex }, name);
            return binder;
        }    

        const targets =  [
            getBinder(text, 1),
            getBinder(attribute, -1, 'foo'),
            getBinder(block, 2),
        ];

        it('identifiers', () => {
            assert$6.deepEqual(binders(targets), [
                `const __bind0 = __textBinder(1);`,
                `const __bind1 = __attrBinder('foo');`,
                `const __bind2 = __blockBinder(2);`
            ]);
        });

    });


    describe('bindings', () => {
        let index = 0;

        function getBinder(options, params$$1, elIndex = 0) {
            const binder = new Binder(options);
            binder.params = params$$1;
            binder.elIndex = elIndex;
            binder.moduleIndex = index++;
            return binder;
        }    

        const identifiers =  [
            getBinder({ ast: (() => foo).toExpr(), type: SUBSCRIBE }, ['foo']),
            getBinder({ ast: (() => non).toExpr(), type: VALUE }, []),
            getBinder({ ast: (() => non).toExpr(), type: MAP }, []),
            getBinder({ ast: (() => bar).toExpr(), type: VALUE }, ['bar']),
            getBinder({ ast: (() => qux).toExpr(), type: MAP }, ['qux']),
        ];

        const expressions =  [
            getBinder({ ast: (() => foo + 1).toExpr(), type: SUBSCRIBE }, ['foo']),
            getBinder({ ast: (() => non + 1).toExpr(), type: VALUE }, []),
            getBinder({ ast: (() => non + 1).toExpr(), type: MAP }, []),
            getBinder({ ast: (() => bar + 1).toExpr(), type: VALUE }, ['bar']),
            getBinder({ ast: (() => qux + 1).toExpr(), type: MAP }, ['qux']),
        ];

        it('identifiers', () => {
            assert$6.deepEqual(bindings(identifiers), [
                `const __sub0 = foo.subscribe(__bind0(__nodes[0]));`,
                `__bind1(__nodes[0])(non);`,
                `__bind2(__nodes[0])(non);`,
                `const __sub3 = bar.first().subscribe(__bind3(__nodes[0]));`,
                `const __sub4 = qux.subscribe(__bind4(__nodes[0]));`,
            ]);
        });

        it('expressions', () => {
            assert$6.deepEqual(bindings(expressions), [
                `const __sub0 = (foo + 1).subscribe(__bind5(__nodes[0]));`,
                `__bind6(__nodes[0])(non + 1);`,
                `__bind7(__nodes[0])(non + 1);`,
                `const __sub3 = bar.map((bar) => (bar + 1)).first().subscribe(__bind8(__nodes[0]));`,
                `const __sub4 = qux.map((qux) => (qux + 1)).subscribe(__bind9(__nodes[0]));`,
            ]);
        });

        it('unsubscribes', () => {
            const expected = [
                `__sub0.unsubscribe();`,
                `__sub3.unsubscribe();`,
                `__sub4.unsubscribe();`,
            ];
            assert$6.deepEqual(unsubscribes$1(identifiers), expected);
            assert$6.deepEqual(unsubscribes$1(expressions), expected);
        });
    });

    describe('subtemplates', () => {
       
        it('write subtemplates', () => {
            const binder = new Binder({ 
                ast: (() => foo ? __t0_0 : __t0_1).toExpr(),
                type: 'observer'
            });
            binder.params =  ['foo'];
            binder.templates = ['template1', 'template2'];
            const compiled = [];
            const compile = template => compiled.push(template);

            assert$6.deepEqual(subtemplates([binder], compile), [
                `const __t0_0 = 1`,
                `const __t0_1 = 2`
            ]);
        });

    });


});

/* global describe, it */
const assert$7 = chai__default.assert;

describe('find import specifier', () => {

    const getSpecifier = source => findImport(ast(source));

    function testSpecifier(specifier, expected = 'html') {
        assert$7.ok(specifier);
        assert$7.equal(specifier.local.name, expected);
    }

    it('from import', () => {
        const specifier = getSpecifier(`import { html } from 'diamond';`);
        testSpecifier(specifier);
    });	

    it('from imports', () => {
        const specifier = getSpecifier(`
            import foo from './foo';
            import { html } from 'diamond';
            import bar from './bar'`);
        testSpecifier(specifier);
    });	
    
    it('from alias', () => {
        const specifier = getSpecifier(`import { html as $ } from 'diamond';`);
        testSpecifier(specifier, '$');
    });

    it('in list', () => {
        const specifier = getSpecifier(`import { html, css } from 'diamond';`);
        testSpecifier(specifier);
    });

    it('no import okay', () => {
        const specifier = getSpecifier(`import fs from 'fs';`);
        assert$7.notOk(specifier);
    });

});

/*eslint no-unused-vars: off */
/* globals _ */
describe('find templates', () => {
    
    const getTemplate = source => findTemplates(source.toAst());
    
    // const isProgramTTE = ({ ancestors, node }) => {
    //     assert.ok(ancestors.length);
    //     assert.equal(ancestors[0].type, 'Program');
    //     assert.equal(node.type, 'TaggedTemplateExpression');
    // };


    const isTTE = (node) => {
        chai.assert.equal(node.type, 'TaggedTemplateExpression');
    };

    const parentType = ({ ancestors }) => ancestors[ancestors.length - 1].type;

    it('raw', () => {
    
        function source() {
            _`<span>${'foo'}</span>`;
        }

        const templates = getTemplate(source);
        chai.assert.equal(templates.length, 1);
        const [ template ] = templates;
        isTTE(template);
        // assert.equal(parentType(template), 'ExpressionStatement');
    });

    it('direct return from arrow function', () => {

        function source() {
            foo => _`<span>${foo}</span>`;
        }

        const templates = getTemplate(source);
        chai.assert.equal(templates.length, 1);
        const [ template ] = templates;
        isTTE(template);
        // assert.equal(parentType(template), 'ArrowFunctionExpression');
    });

    it('variable declaration', () => {

        function source() {
            const foo = _`<span>${foo}</span>`;
        }

        const templates = getTemplate(source);
        chai.assert.equal(templates.length, 1);
        const [ template ] = templates;
        isTTE(template);
        // assert.equal(parentType(template), 'VariableDeclarator');
    });

    it('sibling templates', () => {

        function source() {
            const t1 = foo => _`<span>${foo}</span>`;
            const t2 = bar => _`<span>${bar}</span>`;
        }

        const templates = getTemplate(source);
        chai.assert.equal(templates.length, 2);
        isTTE(templates[0]);
        isTTE(templates[1]);     
    });

    it('nested templates', () => {
        function source() {
            foo => _`<span>${ _`nested` }</span>`;
        }

        const templates = getTemplate(source);
        chai.assert.equal(templates.length, 2);
        isTTE(templates[0]);
        isTTE(templates[1]);  
    });
});

/*eslint no-undef: off */
const assert$8 = chai__default.assert;

describe.skip('match observables', () => {

    const match = source => getObservables(
        source.toAst(),
        new Set(['foo', 'bar', 'qux'])
    );
    
    it('match', () => {
        const source = () => foo;
        assert$8.deepEqual(match(source), ['foo']);
    }); 
    
    it('no match', () => {
        const source = () => noFoo;
        assert$8.deepEqual(match(source), []);
    }); 

    it('multiple matches', () => {
        const source = () => foo + bar + qux;
        assert$8.deepEqual(match(source), ['foo', 'bar', 'qux']);
    }); 

    it('mixed', () => {
        const source = () => noFoo + bar;
        assert$8.deepEqual(match(source), ['bar']);
    });
});

/* eslint no-unused-vars: off */
/* globals _ */
const getTemplates = source => findTemplates(source.toAst());

describe.skip('params', () => {

    describe('get identifiers', () => {

        it('single param', () => {
            const identifiers = getIdentifiers([{
                type: 'Identifier',
                name: 'single'
            }]);
            chai.assert.deepEqual(identifiers, ['single']);
        });

        it('two params', () => {
            const identifiers = getIdentifiers([{
                type: 'Identifier',
                name: 'one'
            },
            {
                type: 'Identifier',
                name: 'two'
            }]);
            chai.assert.deepEqual(identifiers, ['one', 'two']);
        });

        it('object pattern', () => {
            const identifiers = getIdentifiers([{
                type: 'ObjectPattern',
                properties: [{
                    type: 'Property',
                    value: {
                        type: 'Identifier',
                        name: 'prop'
                    }
                }, {
                    type: 'Property',
                    value: {
                        type: 'Identifier',
                        name: 'alias'
                    }
                }]
            }]);
            chai.assert.deepEqual(identifiers, ['prop', 'alias']);
        });

        it('nested object pattern', () => {
            const identifiers = getIdentifiers([{
                type: 'ObjectPattern',
                properties: [{
                    type: 'Property',
                    value: {
                        type: 'ObjectPattern',
                        properties: [{
                            type: 'Property',
                            value: {
                                type: 'Identifier',
                                name: 'nested'
                            }        
                        }]
                    }
                }]
            }]);
            chai.assert.deepEqual(identifiers, ['nested']);
        });
    });

    describe('simple top-level', () => {

        const findParamsFor = source => {
            const [{ ancestors }] = getTemplates(source);
            return findParams(ancestors);
        };
                
        it('raw', () => {
            function source() {
                _`<span>${'foo'}</span>`;
            }
            const { params, identifiers } = findParamsFor(source);
            chai.assert.deepEqual(identifiers, []);
            chai.assert.equal(params.length, 0);
        });

        it('direct arrow function return', () => {
            function source() {
                foo => _`<span>${foo}</span>`;
            }
            const { params, identifiers } = findParamsFor(source);
            chai.assert.deepEqual(identifiers, ['foo']);
            chai.assert.equal(params.length, 1);
        });

        it('named function return', () => {
            function source() {
                
            }
            const { params, identifiers } = findParamsFor(source);
            chai.assert.deepEqual(identifiers, ['foo']);
            chai.assert.equal(params.length, 1);
        });

        it('higher order function with template arrow', () => {
            function source() {
                
            }
            const { params, identifiers } = findParamsFor(source);
            chai.assert.deepEqual(identifiers, []);
            chai.assert.equal(params.length, 0);
        });

        it('multiple params', () => {
            function source() {
                (foo, bar) => _`<span>${foo + bar}</span>`;
            }

            const { params, identifiers } = findParamsFor(source);
            chai.assert.deepEqual(identifiers, ['foo', 'bar']);
            chai.assert.equal(params.length, 2);
        });
    });

    describe('sibling templates with shared scope', () => {
        it('same identifer', () => {
            function source() {
                const t1 = (foo, condition) => {
                    const view = _`<span>${foo}</span>`;
                    const edit = _`<input value=${foo}>`;
                    return _`${condition ? view : edit}`;
                };
            }

            const test = ({ ancestors }) => {
                const { params, identifiers } = findParams(ancestors);
                chai.assert.deepEqual(identifiers, ['foo', 'condition']);
                chai.assert.equal(params.length, 2);
            };
            
            const templates = getTemplates(source);
            chai.assert.equal(templates.length, 3);

            test(templates[0]);
            test(templates[1]);
            test(templates[2]);
        });
    });

    describe('nested', () => {
        it('raw', () => {
            function source() {
                foo => _`<span>${_`<p>nested</p>`}</span>`;
            }

            const [{ node, ancestors: parentAncestors }] = getTemplates(source);
            const parentScope = findParams(parentAncestors);
            
            const [{ ancestors }] = findTemplates(node.quasi);

            const { params, identifiers } = findParams(ancestors);
            chai.assert.deepEqual(identifiers, []);
            chai.assert.equal(params.length, 0);
        });

        it('with own params', () => {
            function source() {
                items => _`<span>${items.map(item => _`<p>nested</p>`)}</span>`;
            }

            const [{ node, ancestors: parentAncestors }] = getTemplates(source);
            const parentScope = findParams(parentAncestors);

            const [{ ancestors }] = findTemplates(node.quasi);

            const { params, identifiers } = findParams(ancestors, parentScope);
            chai.assert.deepEqual(identifiers, ['item']);
            chai.assert.equal(params.length, 1);
        });


        it('siblings have own params', () => {
            function source() {
                const template = (items, condition) => {
                    const one = _`<span>${items.map(one => _`<p>${one}</p>`)}</span>`;
                    const two = _`<span>${items.map(two => _`<p>${two}</p>`)}</span>`;
                    return _`${condition ? one : two}`;
                };
            }

            const templates = getTemplates(source);
            chai.assert.equal(templates.length, 3);

            const test = ({ node, ancestors: parentAncestors }, child) => {
                const parentScope = findParams(parentAncestors);
                const { params, identifiers } = parentScope;
                chai.assert.deepEqual(identifiers, ['items', 'condition']);
                chai.assert.equal(params.length, 2);

                if (child) {
                    const [{ ancestors }] = findTemplates(node.quasi);
                    const { params, identifiers } = findParams(ancestors, parentScope);
                    chai.assert.deepEqual(identifiers, [child]);
                    chai.assert.equal(params.length, 1);
                }                
            };

            test(templates[0], 'one');
            test(templates[1], 'two');
            test(templates[2]);
        });
    });
});

/*eslint no-unused-vars: off */
/* globals _ */
const assert$9 = chai__default.assert;


const parseSource = source => {
    const { quasi } = findTemplates(source.toAst())[0];
    // const { identifiers } = findParams(ancestors);
    return parseTemplate$1(quasi) ; //, new Set(identifiers)); 
};

describe('parse template', () => {

    describe('text-node', () => {
    
        function testFirst(binders, options) {
            assert$9.equal(binders.length, 1);
            testText(binders[0], options);
        }    

        function testText(binder, {
            elIndex = 0,
            moduleIndex = -1,
            index = 0,
            name = '',
            type = MAP,
            ref = '',
            params = null,
            templates = null
        } = {}) {
            const { name: astName, type: astType } = binder.ast;
            assert$9.equal(astType, 'Identifier');
            assert$9.equal(astName, ref);
            delete binder.ast;
            delete binder.target;
            assert$9.deepEqual(binder, { elIndex, moduleIndex, index, name, type, params, templates }, `ref: ${ref}`);
        }

        it('stand-alone text node', () => {
            function source() {
                const template = foo => _`*${foo}`;
            }
            const { html, binders } = parseSource(source);
            assert$9.equal(html, '<text-node></text-node>');
            testFirst(binders, { ref: 'foo' });
        });

        it('value text node', () => {
            function source() {
                const template = foo => _`${foo}`;
            }
            const { html, binders } = parseSource(source);
            assert$9.equal(html, '<text-node></text-node>');
            testFirst(binders, { ref: 'foo', type: VALUE });
        });

        it('block text node', () => {
            function source() {
                const template = foo => _`${foo}#`;
            }
            const { html, binders } = parseSource(source);
            assert$9.equal(html, '<block-node></block-node>');
            testFirst(binders, { ref: 'foo', type: VALUE });
        });

        it('block observer text node', () => {
            function source() {
                const template = foo => _`*${foo}#`;
            }
            const { html, binders } = parseSource(source);
            assert$9.equal(html, '<block-node></block-node>');
            testFirst(binders, { ref: 'foo' });
        });

        it('element with text node', () => {
            function source() {
                const template = place => _`<span>hello *${place}</span>`;
            }

            const { html, binders } = parseSource(source);

            assert$9.equal(html,
                '<span data-bind>hello <text-node></text-node></span>'
            );
            testFirst(binders, { index: 1, ref: 'place' });
        });

        it('second element with text node', () => {
            function source() {
                const template = place => _`<span>hello</span> <span>*${place}</span>`;
            }

            const { html, binders } = parseSource(source);

            assert$9.equal(html,
                '<span>hello</span> <span data-bind><text-node></text-node></span>'
            );
            testFirst(binders, { ref: 'place' });
        });

        it('two elements with text node', () => {
            function source() {
                const template = (salutation, place) => _`<span>*${salutation}</span> <span>*${place}</span>`;
            }

            const { html, binders } = parseSource(source);

            assert$9.equal(html,
                '<span data-bind><text-node></text-node></span> <span data-bind><text-node></text-node></span>'
            );
            assert$9.equal(binders.length, 2);
            testText(binders[0], { ref: 'salutation' });
            testText(binders[1], { elIndex: 1, ref: 'place' });
        });

        it('one elements with two text node', () => {
            function source() {
                const template = (salutation, place) => _`<span>*${salutation} *${place}</span>`;
            }

            const { html, binders } = parseSource(source);

            assert$9.equal(html,
                '<span data-bind><text-node></text-node> <text-node></text-node></span>'
            );
            assert$9.equal(binders.length, 2);
            testText(binders[0], { ref: 'salutation' });
            testText(binders[1], { index: 2, ref: 'place' });
        });

        it('child element with text node', () => {
            function source() {
                const template = foo => _`<div><span>*${foo}</span></div>`;
            }

            const { html, binders } = parseSource(source);

            assert$9.equal(html,
                '<div><span data-bind><text-node></text-node></span></div>'
            );
            testFirst(binders, { ref: 'foo' });
        });

        it('multiple nested elements with text node', () => {
            function source() {
                const template = (one, two, three, four, five) => _`
                    <div>*${one}
                        <span>*${three}</span>
                        <p><span>*${five}</span>*${four}</p>
                        *${two}
                    </div>
                `;
            }

            const { html, binders } = parseSource(source);
            assert$9.equal(html, `
                    <div data-bind><text-node></text-node>
                        <span data-bind><text-node></text-node></span>
                        <p data-bind><span data-bind><text-node></text-node></span><text-node></text-node></p>
                        <text-node></text-node>
                    </div>
                `);
            
            assert$9.equal(binders.length, 5);
            testText(binders[0], { elIndex: 0, ref: 'one' });
            testText(binders[1], { elIndex: 0, index: 6, ref: 'two' });
            testText(binders[2], { elIndex: 1, ref: 'three' });
            testText(binders[3], { elIndex: 2, index: 1, ref: 'four' });
            testText(binders[4], { elIndex: 3, ref: 'five' });
        });
    });

    describe('attribute', () => {

        function testFirst(binders, options) {
            assert$9.equal(binders.length, 1);
            testAttr(binders[0], options);
        }   
        
        function testAttr(binder, {
            elIndex = 0,
            moduleIndex = -1,
            name = '',
            index = -1,
            type = VALUE,
            ref = '',
            params = null,
            templates = null
        } = {}) {
            assert$9.ok(binder, 'binder does not exist');
            const { ast } = binder;
            assert$9.equal(ast.type, 'Identifier');
            assert$9.equal(ast.name, ref);
            delete binder.ast;
            delete binder.target;
            assert$9.deepEqual(binder, { elIndex, moduleIndex, name, index, type, params, templates }, `name: ${name}`);
        }

        it('simple', () => {
            function source() {
                const template = foo => _`<span bar=${foo}></span>`;
            }
            const { html, binders } = parseSource(source);
            assert$9.equal(html, '<span bar="" data-bind></span>');
            testFirst(binders, { name: 'bar', ref: 'foo' });
        });

        it('with statics, value and valueless', () => {
            function source() {
                const template = foo => _`<input class=${foo} type="checkbox" checked>`;
            }
            const { html, binders } = parseSource(source);
            // NOTE: empty string is equivalent to boolean attribute per spec.
            assert$9.equal(html, '<input class="" type="checkbox" checked="" data-bind>');
            testFirst(binders, { name: 'class', ref: 'foo' });
        });

        it('many', () => {
            function source() {
                const template = (one, two, three, four, five) => _`
                    <div one=${one}>
                        <span two=${two}>${three}</span>
                        <p><span four=${four}>text</span></p>
                    </div>
                `;
            }
            const { html, binders } = parseSource(source);
            assert$9.equal(html, `
                    <div one="" data-bind>
                        <span two="" data-bind><text-node></text-node></span>
                        <p><span four="" data-bind>text</span></p>
                    </div>
                `);
            
            assert$9.equal(binders.length, 4);
            testAttr(binders[0], { elIndex: 0, name: 'one', ref: 'one' });
            testAttr(binders[1], { elIndex: 1, name: 'two', ref: 'two' });
            testAttr(binders[3], { elIndex: 2, name: 'four', ref: 'four' });
        });

        it('binding types', () => {
            function source() {
                const template = (one, two, three) => _`<span one=${one} two=*${two} three=@${three}></span>`;
            }
            const { html, binders } = parseSource(source);
            assert$9.equal(html, '<span one="" two="" three="" data-bind></span>');
            assert$9.equal(binders.length, 3);
            testAttr(binders[0], { type: VALUE, name: 'one', ref: 'one' });
            testAttr(binders[1], { type: MAP, name: 'two', ref: 'two' });
            testAttr(binders[2], { type: SUBSCRIBE, name: 'three', ref: 'three' });
        });
    });

    describe('html', () => {
        it('leaves void elements intact', () => {
            function source() {
                const template = foo => _`<input>`;
            }
            const { html, binders } = parseSource(source);
            assert$9.equal(html, '<input>');
        });
    });
});

/*eslint no-unused-vars: off */
/* globals _ */
const assert$10 = chai__default.assert;

const parseTemplates = source => parse$1(source.toAst());


describe('parse', () => {

    function testTemplate({ html, bindings, node }) {
        assert$10.isNotNull(html);
        assert$10.isNotNull(bindings);
        assert$10.isNotNull(node);       
    }

    it('single template', () => {
    
        function source() {
            const template = (foo, bar) => _`
                <span class-foo=${foo}>hello ${bar}</span>
            `;
        }
        const templates = parseTemplates(source);
        assert$10.equal(templates.length, 1, 'expected one template');
        templates.forEach(testTemplate);
    });

    it('sibling templates', () => {
        function source() {
            const template1 = foo => _`${foo}`;
            const template2 = foo => _`${foo}`;
        }

        const templates = parseTemplates(source);
        assert$10.equal(templates.length, 2);
        templates.forEach(testTemplate);
    });
    
    // TODO: nest template in non-block should warn
    
    it('nested template', () => {
        function source() {
            const template = items => _`
                <ul>
                    #${items.map(item => _`
                        <li>${item}</li>
                    `)}
                </ul>
            `;
        }

        const templates = parseTemplates(source);
        assert$10.equal(templates.length, 2);
        templates.forEach(testTemplate);

    });

    it.skip('nested template with outer scope', () => {
        function source() {
            const template = items => _`
                <ul>
                    #${items.length || _`<span>No items</span>`}
                    #${items.map(item => _`
                        <li>${item + 'of' + items}</li>
                    `)}
                </ul>
            `;
        }

        const templates = parseTemplates(source);
        const [{ binders: outerBinders }] = templates;

        const [ firstOuter, secondOuter ] = outerBinders;
        
        {
            const { templates: nested } = firstOuter;
            assert$10.equal(nested.length, 1);

            nested.forEach((t, i) => testTemplate(t, i, 0));
            const [{ params, binders }] = nested;
            assert$10.equal(params.length, 0);
            assert$10.equal(binders.length, 0);
        }

        {
            const { templates: nested } = secondOuter;
            assert$10.equal(nested.length, 1);

            nested.forEach((t, i) => testTemplate(t, i, 1));
            const [{ params, binders }] = nested;
            assert$10.equal(params.length, 1);
            assert$10.equal(binders.length, 1);

            const [binder] = binders;
            // TODO: skipping because how params handled is changing
            //assert.deepEqual(binder.params, ['item', 'items']);
        }
    });

});

const assert$11 = chai__default.assert;
describe('sigils', () => {

    describe('binding type', () => {

        function test(text, expected) {
            assert$11.deepEqual(getBindingType(text), expected);
        }

        it('empty string okay', () => {
            test('', { type: VALUE, text: ''});
        });

        it('value', () => {
            test('text', { type: VALUE, text: 'text' });
        });

        it('map observer', () => {
            test('text*', { type: MAP, text: 'text'});
        });

        it('subscribe', () => {
            test('text@', { type: SUBSCRIBE, text: 'text'});
        });

        it('is end of string', () => {
            test('* ', { type: VALUE, text: '* '});
        });

        it('escaped *', () => {
            test('text\\*', { type: VALUE, text: 'text*' });
        });

        it('escaped @', () => {
            test('text\\@', { type: VALUE, text: 'text@' });
        });
    });


    describe('block', () => {

        function test(text, expected) {
            assert$11.deepEqual(getBlock(text), expected);
        }

        it('empty string okay', () => {
            test('', { block: false, text: '' });
        });

        it('no block', () => {
            test('text', { block: false, text: 'text' });
        });

        it('block', () => {
            test('#text', { block: true, text: 'text' });
        });

        it('escaped block', () => {
            test('\\#text', { block: false, text: '#text' });
        });


    });
});

/* global describe, it */
// import parseTemplate from '../src/parse-template';
const assert$12 = chai__default.assert;

describe.skip('makes', () => {

    // it('element attributes', () => {
    //     const { html, bindings } = parseTemplate(`
    //         done => $\`<span 
    //             class="hello" 
    //             class-done=\${done} 
    //             data-custom="custom"></span>\`
    //     `);
        
    //     assert.deepEqual(html, '<span class="hello" data-custom="custom" data-bind></span>');

    //     assert.deepEqual(bindings, 
    //         [{ 
    //             elIndex: 0,
    //             type: 'class',
    //             name: 'class-done',
    //             ref: 'done' 
    //         }]
    //     );
    // });


    // it('element text nodes', () => {
    // 	const { html, bindings } = parseTaggedTemplate(`
    // 		place => $\`
    // 			<span>\${place}</span>
    // 			<span>hello \${place}</span>
    // 			<span>hello \${place}!</span>
    // 		\`
    // 	`);
            
    // 	assert.equal(html, `
    // 			<span data-bind><text-node></text-node></span>
    // 			<span data-bind>hello <text-node></text-node></span>
    // 			<span data-bind>hello <text-node></text-node>!</span>
    // 		` 
    // 	);

    // 	assert.deepEqual(bindings, 
    // 		[{ 
    // 			elIndex: 0,
    // 			type: 'text',
    // 			index: 0,
    // 			ref: 'place' 
    // 		},
    // 		{ 
    // 			elIndex: 1,
    // 			type: 'text',
    // 			index: 1,
    // 			ref: 'place' 
    // 		},
    // 		{ 
    // 			elIndex: 2,
    // 			type: 'text',
    // 			index: 1,
    // 			ref: 'place' 
    // 		}]
    // 	);

    // 	// const greeting = place => $`<span>hello *${place}</span>`;
    // 	// const render = $$(
    // 	// 	'<span data-bind>hello <text-node></text-node></span>',
    // 	// 	(() => { 
    // 	// 		const b0 = bound.text({ ref: 'place', index: 1 });
    // 	// 		return nodes => {
    // 	// 			b0(nodes[0]);
    // 	// 		};
    // 	// 	})()
    // 	//);

    // 	// const render2 = function $$(fragment, bind) {
    // 	// 	return () => {

    // 	// 	}
    // 	// }

    // 	// fb.on('value', render);

        
    // });

    // it('simple nested element with text node', () => {
    // 	const { html, bindings } = parseTaggedTemplate(`
    // 		foo => $\`<div><span>\${foo}</span></div>\`
    // 	`);
            
    // 	assert.equal(html, `<div><span data-bind><text-node></text-node></span></div>`);

    // 	assert.deepEqual(bindings, 
    // 		[{ 
    // 			elIndex: 0,
    // 			type: 'text',
    // 			index: 0,
    // 			ref: 'foo' 
    // 		}]
    // 	);
        
    // });

    // it('element with mixed child nodes', () => {
    // 	const { html, bindings } = parseTaggedTemplate(`
    // 		foo => $\`<div><span>hello</span> \${foo}</div>\`
    // 	`);
            
    // 	assert.equal(html, `<div data-bind><span>hello</span> <text-node></text-node></div>`);

    // 	assert.deepEqual(bindings, 
    // 		[{ 
    // 			elIndex: 0,
    // 			type: 'text',
    // 			index: 2,
    // 			ref: 'foo' 
    // 		}]
    // 	);	
    // });

    // it('multiple bound element in mixed child nodes', () => {
    // 	const { html, bindings } = parseTaggedTemplate(`
    // 		(greeting, place) => $\`<div><span>\${greeting}</span> \${place}</div>\`
    // 	`);
            
    // 	assert.equal(html, `<div data-bind><span data-bind><text-node></text-node></span> <text-node></text-node></div>`);

    // 	assert.deepEqual(bindings, 
    // 		[{ 
    // 			elIndex: 0,
    // 			type: 'text',
    // 			index: 2,
    // 			ref: 'place' 
    // 		}, { 
    // 			elIndex: 1,
    // 			type: 'text',
    // 			index: 0,
    // 			ref: 'greeting' 
    // 		}]
    // 	);	
    // });

    // it('expression', () => {

    // 	// (x, y) => $`*${x} + *${y} = *${x + y}`;
    // 	const compiled = parseTaggedTemplate(`
    // 		(x, y) => $\`*\${x} + *\${y} = *\${x + y}\`
    // 	`);

    // 	assert.deepEqual(compiled, {
    // 		html: '<text-node></text-node> + <text-node></text-node> = <text-node></text-node>',
    // 		bindings: [{ 
    // 			type: 'text',
    // 			index: 1,
    // 			observable: true,
    // 			ref: 'x',
    // 			elIndex: 0 
    // 		}, { 
    // 			type: 'text',
    // 			index: 3,
    // 			observable: true,
    // 			ref: 'y',
    // 			elIndex: 0 
    // 		}, { 
    // 			type: 'text',
    // 			index: 5,
    // 			observable: true,
    // 			expr: 'x + y',
    // 			params: 'x,y',
    // 			elIndex: 0
    // 		}]
    // 	});
        
    // });


});

describe.skip('block compiles', () => {

    it('basic section', () => {
        const compiled = parseTemplate(`
            items => $\`<ul>
                #\${ items.map(item => $\`
                    <li>\${ item }</li>
                \`)}
            </ul>\`
        `);

        assert$12.deepEqual(compiled, {
            html: `<ul data-bind>
                <section-node></section-node>
            </ul>`,
            bindings: [{ 
                elIndex: 0,
                type: 'section',
                index: 1,
                expr: '?' 
            }]
        });	
        
    });
});

// const assert = chai.assert;

describe.skip('assumptions', () => {

    it('closes void elements', () => {
        const handler = {
            onopentag(...args) {
                console.log(args);
            },
            onclosetag(name) {
                console.log(name);
            }
        };

        const parser = new htmlparser.Parser(handler);
        parser.write('<input><p><br>content</p>');
        parser.end();
    });  

});

const assert$13 = chai__default.assert;
describe.skip('Magic String', () => {

    it('ident', () => {
        const source = `
    one;
    two;
    three;`;
        const s = new MagicString(source);
        assert$13.equal(s.toString(), source);
        s.indent();
        assert$13.equal(s.toString(), source, 'AFTER');
    });
});

/*eslint no-undef: off */
const assert$14 = chai__default.assert;
function full(node, callback, b = acorn_dist_walk.base, state, override) {
    (function c(node, st, override) {
        let type = override || node.type;
        b[type](node, st, c);
        callback(node, st, type);
    })(node, state, override);
}


describe.skip('walkers', () => {


    it('recursive', () => {
        function source () {
            
        }

        const ast = source.toAst();

        let scope = null;
         
        acorn_dist_walk.recursive(ast, scope = {}, {
            Function(node, state, c) {
                const params = node.params.reduce((obj, p) => {
                    obj[p.name] = true;
                    return obj;
                }, {});
                state = Object.assign(state, params);
                acorn_dist_walk.base.Function(node, state, c);
            },
            TaggedTemplateExpression(node, state) {
                scope = state;
            }
        });

        assert$14.deepEqual(scope, { foo: true, x: true, y: true });
    });

    it.skip('simple', () => {
        function source () {
            
        }

        const ast = source.toAst();

        const called = [];
         
        acorn_dist_walk.simple(ast, {
            Function(node, state) {
                state.push([node.type, node.id  && node.id.name, node.params.length]);
            }
        }, undefined, called);

        assert$14.deepEqual(called, []);
    });

    it.skip('full', () => {
        function source () {
            
        }

        const ast = source.toAst();

        const called = [];
            
        full(ast, (node, st, type) => {
            st.push(type);
        }, null, called);

        assert$14.deepEqual(called, []);
    });

});

function getBinder$1(options, { module = 0, element = 0 } = {}) {
    const binder = new Binder(options);
    binder.elIndex = element;
    binder.moduleIndex = module;
    return binder;
}

/*eslint no-undef: off */
describe('transform - binding', () => {

    it('value', () => {
        const binder = getBinder$1(
            { ast: (() => foo).toExpr(), type: VALUE },
            { module: 1, element: 2 }
        );
        const ast = binding(binder, 0);
        const code = astring.generate(ast);
        chai.assert.equal(code, '__bind1(__nodes[2])(foo);');
    });

    it('subscribe', () => {
        const binder = getBinder$1(
            { ast: (() => foo).toExpr(), type: SUBSCRIBE },
            { module: 1, element: 3 }
        );
        const ast = binding(binder, 1);
        const code = astring.generate(ast);
        chai.assert.equal(code, 'const __sub1 = foo.subscribe(__bind1(__nodes[3]));');
    });
    
});

/*eslint no-undef: off */
describe('transform - fragment nodes', () => {

    const bindings = [
        getBinder$1({ ast: (() => one).toExpr(), type: SUBSCRIBE }),
        getBinder$1({ ast: (() => two).toExpr(), type: VALUE }),
        getBinder$1({ ast: (() => three).toExpr(), type: SUBSCRIBE }),
    ];

    it('direct return', () => {
        const code = fragment([]).map(astring.generate);
        chai.assert.deepEqual(code, [
            'return __nodes[__nodes.length];'
        ]);
    });

    it('unsubscribes', () => {
        const statements = fragment(bindings).map(astring.generate);
        chai.assert.equal(statements.length, 3);
        const code = [
            statements[0],
            ...statements[1].split('\n').map(s => s.trim()),
            statements[2]
        ];

        chai.assert.deepEqual(code, [
            'const __fragment = __nodes[__nodes.length];',
            '__fragment.unsubscribe = () => {',
            '__sub0.unsubscribe();',
            '__sub2.unsubscribe();',
            '};',
            'return __fragment;'
        ]);
    });

});

/*eslint no-undef: off, no-unused-vars: off */

describe('transform - template', () => {
    const binders = [
        getBinder$1({ ast: (() => one).toExpr(), type: SUBSCRIBE }, { module: 0, element: 0 }),
        getBinder$1({ ast: (() => two).toExpr(), type: VALUE }, { module: 1, element: 0 }),
        getBinder$1({ ast: (() => three).toExpr(), type: SUBSCRIBE }, { module: 1, element: 1 }),
    ];

    it('no bindings', () => {
        const ast$$1 = templateAFE({ binders: [], index: 1 });
        const code = astring.generate(ast$$1);

        codeEqual(code, expected);

        function expected() {
            () => {
                const __nodes = __render1();
                return __nodes[__nodes.length];
            }; // eslint-disable-line
        }
    });

    it('with bindings', () => {
        const ast$$1 = templateAFE({ binders, index: 2 });
        const code = astring.generate(ast$$1);

        codeEqual(code, expected);

        function expected() {
            () => {
                const __nodes = __render2();
                const __sub0 = one.subscribe(__bind0(__nodes[0]));
                __bind1(__nodes[0])(two);
                const __sub2 = three.subscribe(__bind1(__nodes[1]));
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                    __sub0.unsubscribe();
                    __sub2.unsubscribe();
                };
                return __fragment;
            }; // eslint-disable-line
        }
    });

    it('TTE to AFE', () => {
        const AFE = templateAFE({ binders: [], index: 0 });
        const source = () => {
            const template = _``;
        };
        const ast$$1 = source.toAst();

        const TTE = ast$$1.body[0].declarations[0].init;
        TTEtoAFE(TTE, AFE);
        
        const code = astring.generate(ast$$1);
        codeEqual(code, expected);

        function expected() {
            const template = (() => {
                const __nodes = __render0();
                return __nodes[__nodes.length];
            })();
        }
    });

});
//# sourceMappingURL=tests-bundle.js.map
