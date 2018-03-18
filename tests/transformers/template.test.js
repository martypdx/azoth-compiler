/*eslint no-undef: off, no-unused-vars: off */

import { generate } from 'astring';
import getBinder from './getBinder';
import { NO_SIGIL, SUBSCRIBE_SIGIL } from '../../src/parse/sigil-types';

import { assert } from 'chai';
import '../helpers/to-code';
import codeEqual from '../helpers/code-equal';
import { parse } from '../../src/ast';

import { 
    blockStatement,
    arrowFunctionExpression } from '../../src/transformers/common';
import { makeTemplateStatements } from '../../src/transformers/template';

// TODO: there are trailing ";\n" issues in comparisons :(

describe('transform - template', () => {
    let binders = null;

    before(() => {
        binders = [
            getBinder({ ast: (() => one).toExpr(), sigil: SUBSCRIBE_SIGIL }, { module: 0, element: 0 }),
            getBinder({ ast: (() => two).toExpr(), sigil: NO_SIGIL }, { module: 1, element: 0 }),
            getBinder({ ast: (() => three).toExpr(), sigil: SUBSCRIBE_SIGIL }, { module: 1, element: 1 }),
        ];
        const scope = { one: true, three: true };
        binders.forEach((b, i) => {
            b.init({ childIndex: i });        
            b.matchObservables(scope);
        });
    });
    

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
                return __render1().__fragment;
            } // eslint-disable-line
        }
    });

    it('with bindings', () => {
        const body = makeTemplateStatements({ binders, index: 2 });
        const code = arrowFunctionExpression({ body: blockStatement({ body }) });

        codeEqual(makeProgram(code), expected);

        function expected() {
            () => {
                const {__fragment, __nodes} = __render2();
                const __child0 = __nodes[0].childNodes[0];
                const __child1 = __nodes[0].childNodes[1];
                const __child2 = __nodes[1].childNodes[2];
                const __sub0 = one.subscribe(__textBinder(__child0));
                __textBinder(__child1)(two);
                const __sub2 = three.subscribe(__textBinder(__child2));
                __fragment.unsubscribe = () => {
                    __sub0.unsubscribe();
                    __sub2.unsubscribe();
                };
                return __fragment;
            } // eslint-disable-line
        }
    });
});