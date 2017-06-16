import codeEqual from '../helpers/code-equal';
import compile from '../../src/compilers/compile';


describe.only('compiler compiles', () => {

    it('returns new index on add', () => {
        const source = `
            import { html as _ } from 'diamond';
            const template = name => _\`<span>Hello \${name}\`;
        `;

        const compiled = compile(source);

        const expected = `
            const __render0 = renderer(makeFragment(\`<span data-bind>Hello <text-node></text-node></span>\`));
            const __bind0 = __textBinder(1);
            import { __textBinder, render, makeFragment } from 'diamond';
            const template = name => (() => {
                const __nodes = __render0();
                __bind0(__nodes[0])(name);
                return __nodes[__nodes.length - 1];
            })();
        `;

        codeEqual(compiled, expected);
    });

});