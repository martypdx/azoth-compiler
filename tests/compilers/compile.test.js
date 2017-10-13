/*eslint no-unused-vars: off */
/* globals _, $, __renderer, __rawHtml, __textBinder, 
__map, __blockBinder, __attrBinder, __propBinder */
import codeEqual from '../helpers/code-equal';
import compile from '../../src/compilers/compile';

describe('compiler', () => {

    it('hello world', () => {
        const source = `
            import { html as _ } from 'azoth';
            const template = (greeting, name) => _\`<span>\${greeting} \${name}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = __renderer(__rawHtml(\`<span data-bind><text-node></text-node> <text-node></text-node></span>\`));
            import { __renderer, __rawHtml, __textBinder } from 'azoth';
            const template = (greeting, name) => {
                const __nodes = __render0();
                const __child0 = __nodes[0].childNodes[0];
                const __child1 = __nodes[0].childNodes[2];
                __textBinder(__child0)(greeting);
                __textBinder(__child1)(name);
                return __nodes[__nodes.length - 1];
            };
        `;

        codeEqual(compiled, expected);
    }); 

    it('oninit', () => {
        function source() {
            const t = () => _`<span oninit=${node => node.innerText= 'Foo'}></span>`;
        }

        const compiled = compile(source.toCode());

        const expected = () => {
            const __render0 = __renderer(__rawHtml(`<span data-bind></span>`));
            const t = () => {
                const __nodes = __render0();
                (oninit => oninit(__nodes[0]))(node => node.innerText = 'Foo');
                return __nodes[__nodes.length - 1];
            };
        };

        codeEqual(compiled, expected);
    }); 

    it('hello attribute', () => {
        const source = `
            import { html as _ } from 'azoth';
            const template = name => _\`<span class=\${name}>Hello World</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = __renderer(__rawHtml(\`<span class="" data-bind>Hello World</span>\`));
            import { __renderer, __rawHtml, __attrBinder } from 'azoth';
            const template = name => {
                const __nodes = __render0();
                __attrBinder(__nodes[0], 'class')(name);
                return __nodes[__nodes.length - 1];
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
            const __render0 = __renderer(__rawHtml(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const template = name => {
                const __nodes = __render0();
                const __child0 = __nodes[0].childNodes[1];
                __textBinder(__child0)(name);
                return __nodes[__nodes.length - 1];
            };
        `;

        codeEqual(compiled, expected);
    });


    it('orphan text', () => {
        const source = () => {
            const template = name => _`${name}`;
        };

        const compiled = compile(source.toCode());

        const expected = () => {
            const __render0 = __renderer(__rawHtml(`<text-node></text-node>`));
            const template = (name) => {
                const __nodes = __render0();
                const __child0 = __nodes[0].childNodes[0];
                __textBinder(__child0)(name);
                return __nodes[__nodes.length - 1];
            };
        };

        codeEqual(compiled, expected);
    }); 

    it('nested', () => {
        const source = `
            import { html as _ } from 'azoth';
            const template = (foo , bar) => _\`<div>\${ foo ? _\`<span>Hello \${bar}</span>\` : _\`<span>Goodbye \${bar}</span>\`}#</div>\`;
        `;
        const compiled = compile(source);

        const expected = `
            const __render0 = __renderer(__rawHtml(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __render1 = __renderer(__rawHtml(\`<span data-bind>Goodbye <text-node></text-node></span>\`));
            const __render2 = __renderer(__rawHtml(\`<div data-bind><!-- block --></div>\`));
            import { __renderer, __rawHtml, __textBinder, __blockBinder } from 'azoth';
            const template = (foo, bar) => {
                const __nodes = __render2();
                const __child0 = __nodes[0].childNodes[0];
                const __sub0b = __blockBinder(__child0);
                __sub0b.observer(foo ? () => {
                    const __nodes = __render0();
                    const __child0 = __nodes[0].childNodes[1];
                    __textBinder(__child0)(bar);
                    return __nodes[__nodes.length - 1];
                } : () => {
                    const __nodes = __render1();
                    const __child0 = __nodes[0].childNodes[1];
                    __textBinder(__child0)(bar);
                    return __nodes[__nodes.length - 1];
                });
                const __fragment = __nodes[__nodes.length - 1];
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
            const __render0 = __renderer(__rawHtml(\`<span data-bind>Hello <text-node></text-node></span>\`));
            import { __renderer, __rawHtml, __textBinder } from 'azoth';
            const template = name => {
                const __nodes = __render0();
                const __child0 = __nodes[0].childNodes[1];
                const __sub0 = name.subscribe(__textBinder(__child0))
                const __fragment = __nodes[__nodes.length - 1];
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
            const __render0 = __renderer(__rawHtml(\`<span data-bind>Hello <text-node></text-node></span>\`));
            import { __renderer, __rawHtml, __textBinder, __first } from 'azoth';
            const template = name => {
                const __nodes = __render0();
                const __child0 = __nodes[0].childNodes[1];
                const __sub0 = __first(name, __textBinder(__child0));
                const __fragment = __nodes[__nodes.length - 1];
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
            const __render0 = __renderer(__rawHtml(\`<span data-bind><text-node></text-node></span>\`));
            import { __renderer, __rawHtml, __textBinder, __map } from 'azoth';
            const template = x => {
                const __nodes = __render0();
                const __child0 = __nodes[0].childNodes[0];
                const __sub0 = __map(x, x => x * x, __textBinder(__child0));
                const __fragment = __nodes[__nodes.length - 1];
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
            const __render0 = __renderer(__rawHtml(\`<span data-bind><text-node></text-node></span>\`));
            import {__renderer, __rawHtml, __textBinder} from 'azoth';
            const template = __ref0 => {
                const name = __ref0.child('name');
                const __nodes = __render0();
                const __child0 = __nodes[0].childNodes[0];
                const __sub0 = name.subscribe(__textBinder(__child0));
                const __fragment = __nodes[__nodes.length - 1];
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
            const __render0 = __renderer(__rawHtml(\`<span data-bind><text-node></text-node></span>\`));
            import {__renderer, __rawHtml, __textBinder} from 'azoth';
            const template = person => {
                const {name: __ref0} = person;
                const first = __ref0.child('first');
                const __nodes = __render0();
                const __child0 = __nodes[0].childNodes[0];
                const __sub0 = first.subscribe(__textBinder(__child0));
                const __fragment = __nodes[__nodes.length - 1];
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
            const __render0 = __renderer(__rawHtml(\`<span data-bind><text-node></text-node></span>\`));
            import { __renderer, __rawHtml, __textBinder, __combine } from 'azoth';
            const template = (x, y) => {
                const __nodes = __render0();
                const __child0 = __nodes[0].childNodes[0];
                const __sub0 = __combine([x, y], (x, y) => x + y, __textBinder(__child0));
                const __fragment = __nodes[__nodes.length - 1];
                __fragment.unsubscribe = () => {
                    __sub0.unsubscribe();
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
            const __render0 = __renderer(__rawHtml(\`<span data-bind>Hello <!-- component start --><!-- component end --></span>\`));
            import { Block, __renderer, __rawHtml } from 'azoth';
            const template = name => {
                const __nodes = __render0();
                const __child0 = __nodes[0].childNodes[2];
                const __sub0b = Block({ name });
                __sub0b.onanchor(__child0);                
                const __fragment = __nodes[__nodes.length - 1];
                __fragment.unsubscribe = () => {
                    __sub0b.unsubscribe();
                };
                return __fragment;
            };
        `;

        codeEqual(compiled, expected);
    }); 

    it('Widget component with content', () => {
        const source = () => {
            const template = foo => _`<#:${Widget}><span>${foo}</span></#:>`;
        };

        const compiled = compile(source.toCode());

        const expected = () => {
            const __render0 = __renderer(__rawHtml(`<!-- component start --><!-- component end -->`));
            const __render1 = __renderer(__rawHtml(`<span data-bind><text-node></text-node></span>`));
            const template = foo => {
                const __nodes = __render0();
                const __child0 = __nodes[0].childNodes[1];
                const __sub0b = Widget;
                __propBinder(__sub0b, 'content')(() => {
                    const __nodes = __render1();
                    const __child0 = __nodes[0].childNodes[0];
                    __textBinder(__child0)(foo);
                    return __nodes[__nodes.length - 1];
                });
                __sub0b.onanchor(__child0);
                const __fragment = __nodes[__nodes.length - 1];
                __fragment.unsubscribe = () => {
                    __sub0b.unsubscribe();
                };
                return __fragment;
            };
        };

        codeEqual(compiled, expected);
    }); 

    it('block component with attributes and content', () => {
        const source = () => {
            const template = (name, foo=$) => _`<span><#:${Block({ name })} foo=*${foo} bar="bar"><em>${name}</em></#:></span>`;
        };

        const compiled = compile(source.toCode());

        const expected = () => {
            const __render0 = __renderer(__rawHtml(`<span data-bind><!-- component start --><!-- component end --></span>`));
            const __render1 = __renderer(__rawHtml(`<em data-bind><text-node></text-node></em>`));
            const template = (name, foo) => {
                const __nodes = __render0();
                const __child0 = __nodes[0].childNodes[1];
                const __sub0b = Block({ name });
                const __sub0_0 = foo.subscribe(__propBinder(__sub0b, 'foo'));
                __propBinder(__sub0b, 'bar')('bar');
                __propBinder(__sub0b, 'content')(() => {
                    const __nodes = __render1();
                    const __child0 = __nodes[0].childNodes[0];
                    __textBinder(__child0)(name);
                    return __nodes[__nodes.length - 1];
                });
                __sub0b.onanchor(__child0);
                const __fragment = __nodes[__nodes.length - 1];
                __fragment.unsubscribe = () => {
                    __sub0b.unsubscribe();
                    __sub0_0.unsubscribe();
                };
                return __fragment;
            };
        };

        codeEqual(compiled, expected);
    }); 

    /* globals Block, Widget */
    it('block component maintains correct child index', () => {
        const source = () => {
            const template = foo => _`<span>${foo}<#:${Block()}/>${foo}</span>`;
        };

        const compiled = compile(source.toCode());

        const expected = () => {
            const __render0 = __renderer(__rawHtml(`<span data-bind><text-node></text-node><!-- component start --><!-- component end --><text-node></text-node></span>`));
            const template = foo => {
                const __nodes = __render0();
                const __child0 = __nodes[0].childNodes[0];
                const __child1 = __nodes[0].childNodes[2];
                const __child2 = __nodes[0].childNodes[3];
                __textBinder(__child0)(foo);
                const __sub1b = Block();
                __sub1b.onanchor(__child1);
                __textBinder(__child2)(foo);
                const __fragment = __nodes[__nodes.length - 1];
                __fragment.unsubscribe = () => {
                    __sub1b.unsubscribe();
                };
                return __fragment;
            };
        };

        codeEqual(compiled, expected);
    }); 

    // TODO: this should just be tranforms/fragment.js unit test
    it('block component unsubscribes but not its binder', () => {
        const source = () => {
            const template = (name=$) => _`<#:${new Block(name)}></#:>`;
        };

        const compiled = compile(source.toCode());

        const expected = () => {
            const __render0 = __renderer(__rawHtml(`<!-- component start --><!-- component end -->`));
            const template = name => {
                const __nodes = __render0();
                const __child0 = __nodes[0].childNodes[1];
                const __sub0b = new Block(name);
                __sub0b.onanchor(__child0);
                const __fragment = __nodes[__nodes.length - 1];
                __fragment.unsubscribe = () => {
                    __sub0b.unsubscribe();
                };
                return __fragment;
            };
        };

        codeEqual(compiled, expected);
    }); 

    it.skip('class component', () => {
        const source = () => {
            // @Widget
            class Control {
                render() {
                    return _`
                        <div class=${`control ${this.class}`}>
                            ${this.content}#
                        </div>
                    `;
                }
            }
        };

        const compiled = compile(source.toCode());
        
        const expected = () => {
            const __render0 = __renderer(__rawHtml(`
                        <div class="" data-bind>
                            <!-- block -->
                        </div>
                    `));
            class Control extends _ {
                render() {
                    const __nodes = __render0();
                    const __child1 = __nodes[0].childNodes[1];
                    __attrBinder(__nodes[0], 'class')(`control ${this.class}`);
                    const __sub1b = __blockBinder(__child1);
                    __sub1b.observer(this.content);
                    const __fragment = __nodes[__nodes.length - 1];
                    __fragment.unsubscribe = () => {
                        __sub1b.unsubscribe();
                    };
                    return __fragment;
                }
            }
        };

        codeEqual(compiled, expected);
    });

    describe('no subscriptions for undeclareds in nested templates', () => {
        
        it('implicit return template', () => {

            const source = () => {
                const template = ({ foo=$, bar=$}) => _`
                    *${foo.map(f => _`*${bar}`)}#        
                `;
            };

            const compiled = compile(source.toCode());

            const expected = () => {
                const __render0 = __renderer(__rawHtml(`<text-node></text-node>`));
                const __render1 = __renderer(__rawHtml(`
                    <!-- block -->        
                `));
                const template = ({foo, bar}) => {
                    const __nodes = __render1();
                    const __child0 = __nodes[0].childNodes[1];
                    const __sub0b = __blockBinder(__child0);
                    const __sub0 = __map(foo, foo => foo.map(f => {
                        const __nodes = __render0();
                        const __child0 = __nodes[0].childNodes[0];
                        const __sub0 = bar.subscribe(__textBinder(__child0));
                        const __fragment = __nodes[__nodes.length - 1];
                        __fragment.unsubscribe = () => {
                            __sub0.unsubscribe();
                        };
                        return __fragment;
                    }), __sub0b.observer);
                    const __fragment = __nodes[__nodes.length - 1];
                    __fragment.unsubscribe = () => {
                        __sub0.unsubscribe();
                        __sub0b.unsubscribe();
                    };
                    return __fragment;
                };

            };

            codeEqual(compiled, expected);
        });

        it('return statements', () => {
            const source = () => {
                const template = (foo=$, bar=$) => _`
                    $${foo.map(f => {
                        const a = 12;
                        return _`*${bar + a}`;
                    })}#
                `;
            };

            const compiled = compile(source.toCode());

            const expected = () => {
                const __render0 = __renderer(__rawHtml(`<text-node></text-node>`));
                const __render1 = __renderer(__rawHtml(`
                    <!-- block -->
                `));
                const template = (foo, bar) => {
                    const __nodes = __render1();
                    const __child0 = __nodes[0].childNodes[1];
                    const __sub0b = __blockBinder(__child0);
                    const __sub0 = __map(foo, foo => foo.map(f => {
                        const a = 12;
                        const __nodes = __render0();
                        const __child0 = __nodes[0].childNodes[0];
                        const __sub0 = __map(bar, bar => bar + a, __textBinder(__child0));
                        const __fragment = __nodes[__nodes.length - 1];
                        __fragment.unsubscribe = () => {
                            __sub0.unsubscribe();
                        };
                        return __fragment;
                    }), __sub0b.observer, true);
                    const __fragment = __nodes[__nodes.length - 1];
                    __fragment.unsubscribe = () => {
                        __sub0.unsubscribe();
                        __sub0b.unsubscribe();
                    };
                    return __fragment;
                };
            };

            codeEqual(compiled, expected);
        });
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