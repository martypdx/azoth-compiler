import compile from '../src/compile';
import chai from 'chai';
import parse from '../src/ast';
import astring from 'astring';
const assert = chai.assert;

// const removePos = node => {
//     delete node.start;
//     delete node.end;
//     Object.keys(node).forEach(key => {
//         const val = node[key];
//         if(Array.isArray(val)) val.forEach(removePos);
//         if(val && typeof val === 'object') removePos(val);
//     });
// };

const stripParse = code =>  {
    const ast = parse(code);
    // removePos(ast);
    return astring(ast, { indent: '    ' });
};

const tryParse = (name, code) => {
    try {
        return stripParse(code);
    }
    catch(err) {
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

    it('compiles template with various text nodes', () => {
        console.time('compile');
        const code = compile(`
            import { html as $ } from 'diamond';
            const template = (foo, place) => $\`*\${foo}<span>hello *\${place}</span>\${place}\`;
        `);
        console.timeEnd('compile');
        codequal(code, `
            const render_0 = renderer(makeFragment('<text-node></text-node><span data-bind>hello <text-node></text-node></span><text-node></text-node>'));
            const __bind0 = __otb(0);
            const __bind1 = __otb(2);
            const __bind2 = __ctb(1);
            import { renderer, makeFragment, __otb, __ctb } from 'diamond';
            const template = (() => {
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
        `);
    
    });


    it('compiles expression', () => {
        
        const code = compile(`
            (x, y) => $\`<span>*\${x + y}</span>\`;
        `);
        
        codequal(code, `
            const render_0 = renderer(makeFragment('<span data-bind><text-node></text-node></span>'));
            const __bind0 = __ctb(0);

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
        
        `);
    
    });

    it('compiles expression with outside ref', () => {
        
        const code = compile('x => $\`*\${upper(x)}\`');
        
        codequal(code, `
            const render_0 = renderer(makeFragment('<text-node></text-node>'));
            const __bind0 = __otb(0);
            (() => {
                return (x) => {
                    const __nodes = render_0();
                    const __e0 = combineLatest(x,(x)=>(upper(x)));
                    const __s0 = __e0.subscribe(__bind0(__nodes[0]));
                    const __fragment = __nodes[__nodes.length];
                    __fragment.unsubscribe = () => {
                        __s0.unsubscribe();
                    };
                    return __fragment;
                };
            })()
        `);
    });

    it('plucks destructured params', () => {
        
        const code = compile('({foo}) => $\`*\${foo}\`');
        
        codequal(code, `
            const render_0 = renderer(makeFragment(\'<text-node></text-node>\'));
            const __bind0 = __otb(0);
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
        })()`);
    
    });

    it('simple nested block', () => {
        
        const code = compile(`
            place => $\`<div>#\${$\`<span>*\${place}</span>\`}</div>\`;
        `);

        codequal(code, `
            const render_0 = renderer(makeFragment(\'<div data-bind><section-node></section-node></div>\'));
            const render_1 = renderer(makeFragment(\'<span data-bind><text-node></text-node></span>\'));
            const __bind0 = __sb(0);
            const __bind1 = __ctb(0);
            (() => {
                return (place) => {
                    const __nodes = render_0();
                    const __section_0 = __bind0(__nodes[0], () => {
                        const __nodes = render_1();
                        const __s0 = place.subscribe(__bind1(__nodes[0]));
                        const __fragment = __nodes[__nodes.length];
                        __fragment.unsubscribe = () => {
                            __s0.unsubscribe();
                        };
                        return __fragment;
                    });
                    __section_0();
                    const __fragment = __nodes[__nodes.length];
                    __fragment.unsubscribe = () => {
                        __section_0.unsubscribe();
                    };
                    return __fragment;
                };
            })();
        `);
    
    });


    it.skip('nested block with expression', () => {
        
        const code = compile(`
            place => $\`<div>#\${ $\`<span>*\${place}</span>\`}</div>\`
        `);

        codequal(code, `(() => {
            const render_0 = renderer(makeFragment(\`<div data-bind><section-node></section-node></div>\`));
            const render_1 = renderer(makeFragment(\`<span data-bind><text-node></text-node></span>\`));
            const __sb0 = __sb(0);
            const __ctb0 = __ctb(0);
            return (place) => {
                const __nodes = render_0();
                const __section_0 = __sb0(__nodes[0], () => {
                    const __nodes = render_1();
                    const __s0 = place.subscribe(__ctb0(__nodes[0]));
                    const __fragment = __nodes[__nodes.length];
                    __fragment.unsubscribe = () => {
                        __s0.unsubscribe();
                    };
                    return __fragment;
                });
                __section_0();
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                __section_0.unsubscribe();
                };
                return __fragment;
            };
        })()`);
    
    });

});