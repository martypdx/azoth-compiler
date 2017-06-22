/*eslint no-undef: off */
import { generate } from 'astring';
import getBinder from './getBinder';
import { VALUE, SUBSCRIBE } from '../../src/binders/binding-types';

import { assert } from 'chai';

import binding from '../../src/transformers/binding';

describe('transform - binding', () => {

    it('value', () => {
        const binder = getBinder(
            { ast: (() => foo).toExpr(), type: VALUE },
            { module: 1, element: 2 }
        );
        const ast = binding(binder, 0);
        const code = generate(ast);
        assert.equal(code, '__bind1(__nodes[2])(foo);');
    });

    it('subscribe', () => {
        const binder = getBinder(
            { ast: (() => foo).toExpr(), type: SUBSCRIBE },
            { module: 1, element: 3 }
        );
        const ast = binding(binder, 1);
        const code = generate(ast);
        assert.equal(code, 'const __sub1 = foo.subscribe(__bind1(__nodes[3]));');
    });
    
});