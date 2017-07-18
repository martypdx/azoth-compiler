/*eslint no-undef: off, no-unused-vars: off */

import { generate } from 'astring';
import getBinder from './getBinder';
import { NONE, AT } from '../../src/parse/sigil-types';

import { assert } from 'chai';
import '../helpers/to-code';
import codeEqual from '../helpers/code-equal';
import { parse } from '../../src/ast';

// TODO: add templateToFunction tests
import { 
    blockStatement,
    arrowFunctionExpression } from '../../src/transformers/common';
import { makeTemplateStatements } from '../../src/transformers/template';

// TODO: there are trailing ";\n" issues in comparisons :(

describe('transform - template', () => {
    const binders = [
        getBinder({ ast: (() => one).toExpr(), sigil: AT }, { module: 0, element: 0 }),
        getBinder({ ast: (() => two).toExpr(), sigil: NONE }, { module: 1, element: 0 }),
        getBinder({ ast: (() => three).toExpr(), sigil: AT }, { module: 1, element: 1 }),
    ];
    const scope = { one: true, three: true };
    binders.forEach(b => b.matchObservables(scope));

    const makeProgram = code => ({
        type: 'Program',
        sourceType: 'module',
        body: [{
            type: 'ExpressionStatement',
            expression: code,
        }]
    });

    it('no bindings', () => {
        const body = makeTemplateStatements({ binders: [], index: 1 });
        const code = arrowFunctionExpression({ body: blockStatement({ body }) });

        codeEqual(makeProgram(code), expected);

        function expected() {
            () => {
                const __nodes = __render1();
                return __nodes[__nodes.length];
            } // eslint-disable-line
        }
    });

    it('with bindings', () => {
        const body = makeTemplateStatements({ binders, index: 2 });
        const code = arrowFunctionExpression({ body: blockStatement({ body }) });

        codeEqual(makeProgram(code), expected);

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
});