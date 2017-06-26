import codeEqual from '../helpers/code-equal';
import compile from '../../src/compilers/compile';

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

    it.only('hello world observable', () => {
        const source = `
            import { html as _ } from 'diamond';
            const template = (name=$) => _\`<span>Hello \${name}</span>\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __bind0 = __textBinder(1);
            import { renderer, makeFragment, __textBinder } from 'diamond';
            const template = name => (() => {
                const __nodes = __render0();
                name.subscribe(__bind0(__nodes[0]));
                return __nodes[__nodes.length];
            })();
        `;

        codeEqual(compiled, expected);
    }); 

});