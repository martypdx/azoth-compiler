/*globals _, makeFragment, renderer, __textBinder, __blockBinder, combineLatest */
/*eslint semi: off */

import compile from '../../src/compilers/module';
import codeEqual from '../helpers/code-equal';

// import chai from 'chai';
// const assert = chai.assert;


describe.skip('compiler', () => {

    it('adds to import', () => {
        const code = compile(`
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

        const code = compile(template.toCode());

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

        const code = compile(template.toCode());

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
