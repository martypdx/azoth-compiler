/*eslint no-undef: off, no-unused-vars: off */

import { generate } from 'astring';
import getBinder from './getBinder';
import { VALUE, SUBSCRIBE } from '../../src/binders/binding-types';

import { assert } from 'chai';
import codeEqual from '../helpers/code-equal';
import parse from '../../src/ast';

import template, { TTEtoAFE } from '../../src/transformers/template';

describe('transform - template', () => {
    const binders = [
        getBinder({ ast: (() => one).toExpr(), type: SUBSCRIBE }, { module: 0, element: 0 }),
        getBinder({ ast: (() => two).toExpr(), type: VALUE }, { module: 1, element: 0 }),
        getBinder({ ast: (() => three).toExpr(), type: SUBSCRIBE }, { module: 1, element: 1 }),
    ];

    it('no bindings', () => {
        const ast = template({ binders: [], index: 1 });
        const code = generate(ast);

        codeEqual(code, expected);

        function expected() {
            () => {
                const __nodes = __render1();
                return __nodes[__nodes.length - 1];
            } // eslint-disable-line
        }
    });

    it('with bindings', () => {
        const ast = template({ binders, index: 2 });
        const code = generate(ast);

        codeEqual(code, expected);

        function expected() {
            () => {
                const __nodes = __render2();
                const __sub0 = one.subscribe(__bind0(__nodes[0]));
                __bind1(__nodes[0])(two);
                const __sub2 = three.subscribe(__bind1(__nodes[1]));
                const __fragment = __nodes[__nodes.length - 1];
                __fragment.unsubscribe = () => {
                    __sub0.unsubscribe();
                    __sub2.unsubscribe();
                };
                return __fragment;
            } // eslint-disable-line
        }
    });

    it('TTE to AFE', () => {
        const AFE = template({ binders: [], index: 0 });
        const ast = parse('const template = _``;');

        // TODO: use find template?
        const TTE = ast.body[0].declarations[0].init;
        TTEtoAFE(TTE, AFE);
        
        const code = generate(ast);
        codeEqual(code, expected);

        function expected() {
            const template = (() => {
                const __nodes = __render0();
                return __nodes[__nodes.length - 1];
            })();
        }
    });

});