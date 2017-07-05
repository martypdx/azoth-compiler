/*eslint no-undef: off, no-unused-vars: off */

import { generate } from 'astring';
import getBinder from './getBinder';
import { VALUE, SUBSCRIBE } from '../../src/binders/binding-types';

import { assert } from 'chai';
import '../helpers/to-code';
import codeEqual from '../helpers/code-equal';
import parse from '../../src/ast';

import { templateAFE, TTEtoAFE } from '../../src/transformers/template';

describe('transform - template', () => {
    const binders = [
        getBinder({ ast: (() => one).toExpr(), type: SUBSCRIBE }, { module: 0, element: 0 }),
        getBinder({ ast: (() => two).toExpr(), type: VALUE }, { module: 1, element: 0 }),
        getBinder({ ast: (() => three).toExpr(), type: SUBSCRIBE }, { module: 1, element: 1 }),
    ];
    const scope = { one: true, three: true };
    binders.forEach(b => b.matchObservables(scope));

    it('no bindings', () => {
        const ast = templateAFE({ binders: [], index: 1 });
        const code = generate(ast);

        codeEqual(code, expected);

        function expected() {
            () => {
                const __nodes = __render1();
                return __nodes[__nodes.length];
            } // eslint-disable-line
        }
    });

    it('with bindings', () => {
        const ast = templateAFE({ binders, index: 2 });
        const code = generate(ast);

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
            } // eslint-disable-line
        }
    });

    it('TTE to AFE', () => {
        const AFE = templateAFE({ binders: [], index: 0 });
        const source = () => {
            const template = _``;
        };
        const ast = source.toAst();

        const TTE = ast.body[0].declarations[0].init;
        TTEtoAFE(TTE, AFE);
        
        const code = generate(ast);
        codeEqual(code, expected);

        function expected() {
            const template = (() => {
                const __nodes = __render0();
                return __nodes[__nodes.length];
            })();
        }
    });

});