/*eslint no-undef: off, no-unused-vars: off */
import '../helpers/to-code';
import codeEqual from '../helpers/code-equal';
import compile, { schema, binders, bindings, unsubscribes, subtemplates } from '../../src/compilers/template';
import Binder from '../../src/binders/binder';
import parse from '../../src/parse/parse';
import { VALUE, MAP, SUBSCRIBE } from '../../src/binders/binding-types';
import { text, block, attribute } from '../../src/binders/targets';

import chai from 'chai';
const assert = chai.assert;

describe.skip('compile template', () => {

    describe('integration (full template)', () => {

        const parseTemplates = source => parse(source.toAst());

        it('simple', () => {

            function source() {
                const template = name => _`<span>Hello ${name}</span>`;
            }

            const [ template ] = parseTemplates(source);
            const compiled = compile(template);

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
            const compiled = compile(template);

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
            const binders = ['binder1;', 'binder2;'];
            const params = {
                params: ['param1', 'param2'],
                destructure: ['destructure1;', 'destructure2;']
            };
            const render = 'render0';
            const bindings = ['bindings1;', 'bindings2;'];
            const unsubscribes = ['unsubscribe1;', 'unsubscribe1;'];

            const template = schema({ binders, params, render, bindings, unsubscribes });
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
            const binders = ['binder1;', 'binder2;'];
            const params = {
                params: ['param1', 'param2'],
                destructure: []
            };
            const render = 'render0';
            const bindings = ['bindings1;', 'bindings2;'];
            const unsubscribes = [];

            const template = schema({ binders, params, render, bindings, unsubscribes });
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
            const binders = [];
            const params = {
                params: [],
                destructure: []
            };
            const render = 'render0';
            const bindings = [];
            const unsubscribes = [];

            const template = schema({ binders, params, render, bindings, unsubscribes });
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
            assert.deepEqual(binders(targets), [
                `const __bind0 = __textBinder(1);`,
                `const __bind1 = __attrBinder('foo');`,
                `const __bind2 = __blockBinder(2);`
            ]);
        });

    });


    describe('bindings', () => {
        let index = 0;

        function getBinder(options, params, elIndex = 0) {
            const binder = new Binder(options);
            binder.params = params;
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
            assert.deepEqual(bindings(identifiers), [
                `const __sub0 = foo.subscribe(__bind0(__nodes[0]));`,
                `__bind1(__nodes[0])(non);`,
                `__bind2(__nodes[0])(non);`,
                `const __sub3 = bar.first().subscribe(__bind3(__nodes[0]));`,
                `const __sub4 = qux.subscribe(__bind4(__nodes[0]));`,
            ]);
        });

        it('expressions', () => {
            assert.deepEqual(bindings(expressions), [
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
            assert.deepEqual(unsubscribes(identifiers), expected);
            assert.deepEqual(unsubscribes(expressions), expected);
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

            assert.deepEqual(subtemplates([binder], compile), [
                `const __t0_0 = 1`,
                `const __t0_1 = 2`
            ]);
        });

    });


});