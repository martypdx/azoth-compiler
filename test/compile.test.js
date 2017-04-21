/*globals $, makeFragment, renderer, __tb, __bb, combineLatest */

/*eslint semi: off */

import compile from '../src/compile';
import chai from 'chai';
import parse from '../src/ast';
import astring from 'astring';

const assert = chai.assert;

const stripParse = code => {
    const ast = parse(code);
    return astring(ast, { indent: '    ' });
};

const tryParse = (name, code) => {
    try {
        return stripParse(code);
    }
    catch (err) {
        console.log('FAILED PARSE:', name, '\nERROR:', err, '\nCode:\n', code);
        throw err;
    }
};

function codequal(actual, expected) {
    const parsedActual = tryParse('actual', actual);
    const parsedExpected = tryParse('expected', expected);
    assert.equal(parsedActual, parsedExpected);
}

describe('compiler', () => {

    it('adds to import', () => {
        const code = compile(`
            import { html as $ } from 'diamond';
            const template = foo => $\`*\${foo}\`;
        `);

        codequal(code, `
            const render_0 = renderer(makeFragment(\`<text-node></text-node>\`));
            const __bind0 = __tb(0);
            import { renderer, makeFragment, __tb } from 'diamond';
            const template = (() => {
                return (foo) => {
                    const __nodes = render_0();
                    const __s0 = foo.subscribe(__bind0(__nodes[0]));
                    const __fragment = __nodes[__nodes.length];
                    __fragment.unsubscribe = () => {
                        __s0.unsubscribe();
                    };
                    return __fragment;
                };
            })();
        `);

    });

    it('compiles template with various text nodes', () => {
        function template() {
            (foo, place) => $`*${foo}<span>hello *${place}</span>${place}`;
        }

        // console.time('compile');
        const code = compile(template.toCode());
        // console.timeEnd('compile');

        codequal(code, expected.toCode());

        function expected() {
            const render_0 = renderer(makeFragment(`<text-node></text-node><span data-bind>hello <text-node></text-node></span><text-node></text-node>`));
            const __bind0 = __tb(0);
            const __bind1 = __tb(2);
            const __bind2 = __tb(1);
            (() => {
                return (foo, place) => {
                    const __nodes = render_0();
                    const __s0 = foo.subscribe(__bind0(__nodes[1]));
                    __bind1(__nodes[1])(place.value);
                    const __s2 = place.subscribe(__bind2(__nodes[0]));
                    const __fragment = __nodes[__nodes.length];
                    __fragment.unsubscribe = () => {
                        __s0.unsubscribe();
                        __s2.unsubscribe();
                    };
                    return __fragment;
                };
            })();
        }

    });

    it('compiles expression', () => {

        function template() {
            (x, y) => $`<span>*${x + y}</span>`;
        }

        const code = compile(template.toCode());

        codequal(code, expected.toCode());
        
        function expected() {
            const render_0 = renderer(makeFragment(`<span data-bind><text-node></text-node></span>`));
            const __bind0 = __tb(0);

            (() => {
                return (x, y) => {
                    const __nodes = render_0();
                    const __e0 = combineLatest(x, y, (x, y) => (x + y));
                    const __s0 = __e0.subscribe(__bind0(__nodes[0]));
                    const __fragment = __nodes[__nodes.length];
                    __fragment.unsubscribe = () => {
                        __s0.unsubscribe();
                    };
                    return __fragment;
                };
            })();
        }

    });

    it('compiles expression with outside ref', () => {
        const upper = () => {};
        function template () {
            x => $`*${upper(x)}`;
        }

        const code = compile(template.toCode());

        codequal(code, expected.toCode());
        
        function expected() {
            const render_0 = renderer(makeFragment(`<text-node></text-node>`));
            const __bind0 = __tb(0);
            (() => {
                return (x) => {
                    const __nodes = render_0();
                    const __e0 = x.map(x=>(upper(x)));
                    const __s0 = __e0.subscribe(__bind0(__nodes[0]));
                    const __fragment = __nodes[__nodes.length];
                    __fragment.unsubscribe = () => {
                        __s0.unsubscribe();
                    };
                    return __fragment;
                };
            })()
        }
    });

    it('plucks destructured params', () => {

        function template () {
            ({foo}) => $`*${foo}`
        }

        const code = compile(template.toCode());

        codequal(code, expected.toCode());
        
        function expected() {
            const render_0 = renderer(makeFragment(`<text-node></text-node>`));
            const __bind0 = __tb(0);
            (() => {
                return (__ref0) => {
                    const __nodes = render_0();
                    const foo = __ref0.pluck('foo').distinctUntilChanged();
                    const __s0 = foo.subscribe(__bind0(__nodes[0]));
                    const __fragment = __nodes[__nodes.length];
                    __fragment.unsubscribe = () => {
                        __s0.unsubscribe();
                    };
                    return __fragment;
                };
            })()   
        }

    });

    describe('blocks not observed', () => {

    
        it('simple nested block', () => {

            function template() {
                place => $`<div>#${$`<span>*${place}</span>`}</div>`;
            }

            const code = compile(template.toCode());

            codequal(code, expected.toCode());
            
            function expected() {
                const render_0 = renderer(makeFragment(`<div data-bind><block-node></block-node></div>`));
                const render_1 = renderer(makeFragment(`<span data-bind><text-node></text-node></span>`));
                const __bind0 = __bb(0);
                const __bind1 = __tb(0);
                (() => {
                    return (place) => {
                        const __nodes = render_0();
                        const t0 = () => {
                            const __nodes = render_1();
                            const __s0 = place.subscribe(__bind1(__nodes[0]));
                            const __fragment = __nodes[__nodes.length];
                            __fragment.unsubscribe = () => {
                                __s0.unsubscribe();
                            };
                            return __fragment;
                        }
                        __bind0(__nodes[0])(t0);
                        const __fragment = __nodes[__nodes.length];
                        __fragment.unsubscribe = () => {};
                        return __fragment;
                    };
                })();
            }

        });

        it('return block from expression', () => {

            function template() {
                choice => $`#${choice ? $`<span>Yes</span>` : $`<span>No</span>`}`;
            }

            const code = compile(template.toCode());

            codequal(code, expected.toCode());
            
            function expected() {
                const render_0 = renderer(makeFragment(`<block-node></block-node>`));
                const render_1 = renderer(makeFragment(`<span>Yes</span>`));
                const render_2 = renderer(makeFragment(`<span>No</span>`));
                const __bind0 = __bb(0);
                (() => {
                    return (choice) => {
                        const __nodes = render_0();
                        const t0 = () => {
                            const __nodes = render_1();
                            const __fragment = __nodes[__nodes.length];
                            __fragment.unsubscribe = () => {};
                            return __fragment;
                        };
                        const t1 = () => {
                            const __nodes = render_2();
                            const __fragment = __nodes[__nodes.length];
                            __fragment.unsubscribe = () => {};
                            return __fragment;
                        };
                        __bind0(__nodes[0])(choice ? t0 : t1);

                        const __fragment = __nodes[__nodes.length];
                        __fragment.unsubscribe = () => {};
                        return __fragment;
                    };
                })();
            }
        });
    });


    describe('blocks observed', () => {


        it('return block from expression', () => {

            function template() {
                choice => $`*#${choice ? $`<span>Yes</span>` : $`<span>No</span>`}`;
            }

            const code = compile(template.toCode());

            codequal(code, expected.toCode());
            
            function expected() {
                const render_0 = renderer(makeFragment(`<block-node></block-node>`));
                const render_1 = renderer(makeFragment(`<span>Yes</span>`));
                const render_2 = renderer(makeFragment(`<span>No</span>`));
                const __bind0 = __bb(0);
                (() => {
                    return (choice) => {
                        const __nodes = render_0();
                        const t0 = () => {
                            const __nodes = render_1();
                            const __fragment = __nodes[__nodes.length];
                            __fragment.unsubscribe = () => {};
                            return __fragment;
                        };
                        const t1 = () => {
                            const __nodes = render_2();
                            const __fragment = __nodes[__nodes.length];
                            __fragment.unsubscribe = () => {};
                            return __fragment;
                        };
                        const __e0 = choice.map(choice => choice ? t0 : t1);
                        const __s0 = __e0.subscribe(__bind0(__nodes[0]));

                        const __fragment = __nodes[__nodes.length];
                        __fragment.unsubscribe = () => {
                            __s0.unsubscribe();
                        };
                        return __fragment;
                    };
                })();
            }
        });
    });

});