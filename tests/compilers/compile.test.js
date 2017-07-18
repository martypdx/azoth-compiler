/*eslint no-unused-vars: off */
/* globals _, $, renderer, makeFragment, __textBinder, __map */
import codeEqual from '../helpers/code-equal';
import compile from '../../src/compilers/compile';

describe('compiler', () => {

    it('hello world', () => {
        const source = `
            import { html as _ } from 'diamond-ui';
            const template = name => _\`<span>Hello \${name}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __bind0 = __textBinder(1);
            import { renderer, makeFragment, __textBinder } from 'diamond-ui';
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
            import { html as _ } from 'diamond-ui';
            const template = (foo , bar) => _\`<div>\${ foo ? _\`<span>Hello \${bar}</span>\` : _\`<span>Goodbye \${bar}</span>\`}#</div>\`;
        `;
        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __render1 = renderer(makeFragment(\`<span data-bind>Goodbye <text-node></text-node></span>\`));
            const __render2 = renderer(makeFragment(\`<div data-bind><!-- block --></div>\`));
            const __bind0 = __textBinder(1);
            const __bind1 = __blockBinder(0);
            import { renderer, makeFragment, __textBinder, __blockBinder } from 'diamond-ui';
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
            import { html as _ } from 'diamond-ui';
            const template = (name=$) => _\`<span>Hello *\${name}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __bind0 = __textBinder(1);
            import { renderer, makeFragment, __textBinder } from 'diamond-ui';
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
            import { html as _ } from 'diamond-ui';
            const template = (name=$) => _\`<span>Hello $\${name}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __bind0 = __textBinder(1);
            import { renderer, makeFragment, __textBinder, __first } from 'diamond-ui';
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
            import { html as _ } from 'diamond-ui';
            const template = (x=$) => _\`<span>*\${x * x}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind><text-node></text-node></span>\`));
            const __bind0 = __textBinder(0);
            import { renderer, makeFragment, __textBinder, __map } from 'diamond-ui';
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


    it('destructured observable', () => {
        const source = `
            import { html as _ } from 'diamond-ui';
            const template = ({ name }=$) => _\`<span>*\${name}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind><text-node></text-node></span>\`));
            const __bind0 = __textBinder(0);
            import {renderer, makeFragment, __textBinder} from 'diamond-ui';
            const template = __ref0 => {
                const name = __ref0.child("name");
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

    it('combined observable expression', () => {
        const source = `
            import { html as _ } from 'diamond-ui';
            const template = (x=$, y=$) => _\`<span>*\${x + y}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind><text-node></text-node></span>\`));
            const __bind0 = __textBinder(0);
            import { renderer, makeFragment, __textBinder, __combine } from 'diamond-ui';
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
});