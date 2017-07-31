/*eslint no-unused-vars: off */
/* globals _, $, renderer, makeFragment, __textBinder, __map, __componentBinder */
import codeEqual from '../helpers/code-equal';
import compile from '../../src/compilers/compile';

describe('compiler', () => {

    it('hello world', () => {
        const source = `
            import { html as _ } from 'azoth';
            const template = name => _\`<span>Hello \${name}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __bind0 = __textBinder(1);
            import { renderer, makeFragment, __textBinder } from 'azoth';
            const template = name => {
                const __nodes = __render0();
                __bind0(__nodes[0])(name);
                return __nodes[__nodes.length];
            };
        `;

        codeEqual(compiled, expected);
    }); 

    it('no import', () => {
        function source() {
            const template = name => _`<span>Hello ${name}</span>`;
        }

        const compiled = compile(source.toCode());

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __bind0 = __textBinder(1);
            const template = name => {
                const __nodes = __render0();
                __bind0(__nodes[0])(name);
                return __nodes[__nodes.length];
            };
        `;

        codeEqual(compiled, expected);
    });

    it('nested', () => {
        const source = `
            import { html as _ } from 'azoth';
            const template = (foo , bar) => _\`<div>\${ foo ? _\`<span>Hello \${bar}</span>\` : _\`<span>Goodbye \${bar}</span>\`}#</div>\`;
        `;
        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __render1 = renderer(makeFragment(\`<span data-bind>Goodbye <text-node></text-node></span>\`));
            const __render2 = renderer(makeFragment(\`<div data-bind><!-- block --></div>\`));
            const __bind0 = __textBinder(1);
            const __bind1 = __blockBinder(0);
            import { renderer, makeFragment, __textBinder, __blockBinder } from 'azoth';
            const template = (foo, bar) => {
                const __nodes = __render2();
                const __sub0b = __bind1(__nodes[0]);
                __sub0b.observer(foo ? () => {
                    const __nodes = __render0();
                    __bind0(__nodes[0])(bar);
                    return __nodes[__nodes.length];
                } : () => {
                    const __nodes = __render1();
                    __bind0(__nodes[0])(bar);
                    return __nodes[__nodes.length];
                });
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                    __sub0b.unsubscribe();
                };
                return __fragment
            };
        `;

        codeEqual(compiled, expected);
    });

    it('hello world observable', () => {
        const source = `
            import { html as _ } from 'azoth';
            const template = (name=$) => _\`<span>Hello *\${name}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __bind0 = __textBinder(1);
            import { renderer, makeFragment, __textBinder } from 'azoth';
            const template = name => {
                const __nodes = __render0();
                const __sub0 =  name.subscribe(__bind0(__nodes[0]));
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                    __sub0.unsubscribe();
                };
                return __fragment;
            };
        `;

        codeEqual(compiled, expected);
    }); 

    it('hello world once observable', () => {
        const source = `
            import { html as _ } from 'azoth';
            const template = (name=$) => _\`<span>Hello $\${name}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __bind0 = __textBinder(1);
            import { renderer, makeFragment, __textBinder, __first } from 'azoth';
            const template = name => {
                const __nodes = __render0();
                const __sub0 = __first(name, __bind0(__nodes[0]));
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                    __sub0.unsubscribe();
                };
                return __fragment;
            };
        `;

        codeEqual(compiled, expected);
    }); 

    it('mapped observable expression', () => {
        const source = `
            import { html as _ } from 'azoth';
            const template = (x=$) => _\`<span>*\${x * x}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind><text-node></text-node></span>\`));
            const __bind0 = __textBinder(0);
            import { renderer, makeFragment, __textBinder, __map } from 'azoth';
            const template = x => {
                const __nodes = __render0();
                const __sub0 = __map(x, x => (x * x), __bind0(__nodes[0]));
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                    __sub0.unsubscribe();
                };
                return __fragment;
            };
        `;

        codeEqual(compiled, expected);
    }); 


    it('destructured param observable', () => {
        const source = `
            import { html as _ } from 'azoth';
            const template = ({ name }=$) => _\`<span>*\${name}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind><text-node></text-node></span>\`));
            const __bind0 = __textBinder(0);
            import {renderer, makeFragment, __textBinder} from 'azoth';
            const template = __ref0 => {
                const name = __ref0.child('name');
                const __nodes = __render0();
                const __sub0 = name.subscribe(__bind0(__nodes[0]));
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                    __sub0.unsubscribe();
                };
                return __fragment;
            };
        `;

        codeEqual(compiled, expected);
    }); 

    it('destructured variable observable', () => {
        const source = `
            import { html as _ } from 'azoth';
            const template = person => {
                const { name: { first }=$ } = person;
                return _\`<span>*\${first}</span>\`;
            };
        `;
        
        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind><text-node></text-node></span>\`));
            const __bind0 = __textBinder(0);
            import {renderer, makeFragment, __textBinder} from 'azoth';
            const template = person => {
                const {name: __ref0} = person;
                const first = __ref0.child('first');
                const __nodes = __render0();
                const __sub0 = first.subscribe(__bind0(__nodes[0]));
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                    __sub0.unsubscribe();
                };
                return __fragment;
            };
        `;

        codeEqual(compiled, expected);
    }); 

    it('combined observable expression', () => {
        const source = `
            import { html as _ } from 'azoth';
            const template = (x=$, y=$) => _\`<span>*\${x + y}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind><text-node></text-node></span>\`));
            const __bind0 = __textBinder(0);
            import { renderer, makeFragment, __textBinder, __combine } from 'azoth';
            const template = (x, y) => {
                const __nodes = __render0();
                const __sub0 = __combine([x, y], (x, y) => (x + y), __bind0(__nodes[0]));
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                    __sub0.unsubscribe();
                };
                return __fragment;
            };
        `;

        codeEqual(compiled, expected);
    }); 

    
    it('no subscriptions for undeclareds in nested templates', () => {
        const source = `
            import { html as _ } from 'azoth';
            const template = ({ foo=$, bar=$}) => _\`
                *\${foo.map(f => _\`*\${bar}\`)}#        
            \`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<text-node></text-node>\`));
            const __render1 = renderer(makeFragment(\`
                <!-- block -->        
            \`));
            const __bind0 = __textBinder(0);
            const __bind1 = __blockBinder(1);
            import {renderer, makeFragment, __textBinder, __blockBinder, __map} from 'azoth';
            const template = ({foo, bar}) => {
                const __nodes = __render1();
                const __sub0b = __bind1(__nodes[0]);
                const __sub0 = __map(foo, foo => foo.map(f => {
                    const __nodes = __render0();
                    const __sub0 = bar.subscribe(__bind0(__nodes[0]));
                    const __fragment = __nodes[__nodes.length];
                    __fragment.unsubscribe = () => {
                        __sub0.unsubscribe();
                    };
                    return __fragment;
                }), __sub0b.observer);
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                    __sub0.unsubscribe();
                    __sub0b.unsubscribe();
                };
                return __fragment;
            };

        `;

        codeEqual(compiled, expected);
    }); 

    it('block component', () => {
        const source = `
            import { _, Block } from 'azoth';
            const template = name => _\`<span>Hello <#:\${Block({ name })}/></span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <!-- component start --><!-- component end --></span>\`));
            const __bind0 = __componentBinder(1);
            import { Block, renderer, makeFragment, __componentBinder } from 'azoth';
            const template = name => {
                const __nodes = __render0();
                const __sub0b = Block({ name });
                __sub0b.onanchor(__bind0(__nodes[0]));
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                    __sub0b.unsubscribe();
                };
                return __fragment;
            };
        `;

        codeEqual(compiled, expected);
    }); 

    it('block component with attributes and child function', () => {
        const source = `
            import { _, Block } from 'azoth';
            const template = (name, foo=$) => _\`<span><#:\${Block({ name })} foo=*\${foo} bar="bar">\${() => _\`child-template\`}</#:></span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`child-template\`));
            const __render1 = renderer(makeFragment(\`<span data-bind><!-- component start --><!-- component end --></span>\`));
            const __bind0 = __componentBinder(0);
            const __bind1 = __propBinder('foo');
            const __bind2 = __propBinder('bar');
            const __bind3 = __propBinder('children');
            import { Block, renderer, makeFragment, __componentBinder, __propBinder } from 'azoth';
            const template = (name, foo) => {
                const __nodes = __render1();
                const __sub0b = Block({ name });
                const __sub0_0 = foo.subscribe(__bind1(__sub0b));
                __bind2(__sub0b)('bar');
                __bind3(__sub0b)(() => {
                    const __nodes = __render0();
                    return __nodes[__nodes.length];
                });
                __sub0b.onanchor(__bind0(__nodes[0]));
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                    __sub0b.unsubscribe();
                    __sub0_0.unsubscribe();
                };
                return __fragment;
            };
        `;

        codeEqual(compiled, expected);
    }); 

    /* globals Block */
    it('block component maintains correct child index', () => {
        const source = () => {
            const template = foo => _`<span>${foo}<#:${Block()}/>${foo}</span>`;
        };

        const compiled = compile(source.toCode());

        const expected = () => {
            const __render0 = renderer(makeFragment(`<span data-bind><text-node></text-node><!-- component start --><!-- component end --><text-node></text-node></span>`));
            const __bind0 = __textBinder(0);
            const __bind1 = __componentBinder(1);
            const __bind2 = __textBinder(3);
            const template = foo => {
                const __nodes = __render0();
                __bind0(__nodes[0])(foo);
                const __sub1b = Block();
                __sub1b.onanchor(__bind1(__nodes[0]));
                __bind2(__nodes[0])(foo);
                const __fragment = __nodes[__nodes.length];
                __fragment.unsubscribe = () => {
                    __sub1b.unsubscribe();
                };
                return __fragment;
            };
        };

        codeEqual(compiled, expected);
    }); 

    // // for debug of files that are failing compile.
    // // put file contents in ./build/test-file.js
    // it('parses domUtil file', () => {
    //     const source = readFileSync(__dirname + '/test-file.js', 'utf8');
    //     const compiled = compile(source);
    //     assert.ok(compiled);
    // });
});

// import { readFileSync } from 'fs';
// import assert from 'assert';