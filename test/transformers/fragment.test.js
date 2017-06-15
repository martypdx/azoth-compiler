/*eslint no-undef: off */
import { generate } from 'astring';
import getBinder from './getBinder';
import { VALUE, SUBSCRIBE } from '../../src/binders/binding-types';
import { assert } from 'chai';

import fragment from '../../src/transformers/fragment';

describe('transform - fragment nodes', () => {

    const bindings = [
        getBinder({ ast: (() => one).toExpr(), type: SUBSCRIBE }),
        getBinder({ ast: (() => two).toExpr(), type: VALUE }),
        getBinder({ ast: (() => three).toExpr(), type: SUBSCRIBE }),
    ];

    it('direct return', () => {
        const code = fragment([]).map(generate);
        assert.deepEqual(code, [
            'return __nodes[__nodes.length - 1];'
        ]);
    });

    it('unsubscribes', () => {
        const statements = fragment(bindings).map(generate);
        assert.equal(statements.length, 3);
        const code = [
            statements[0],
            ...statements[1].split('\n').map(s => s.trim()),
            statements[2]
        ];

        assert.deepEqual(code, [
            'const __fragment = __nodes[__nodes.length - 1];',
            '__fragment.unsubscribe = () => {',
            '__sub0.unsubscribe();',
            '__sub2.unsubscribe();',
            '};',
            'return __fragment;'
        ]);
    });

});

