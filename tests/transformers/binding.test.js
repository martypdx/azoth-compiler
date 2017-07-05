/*eslint no-undef: off */
import { generate } from 'astring';
import getBinder from './getBinder';
import { MAP, SUBSCRIBE, VALUE } from '../../src/binders/binding-types';

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
        binder.observables = ['foo'];
        const ast = binding(binder, 1);
        const code = generate(ast);
        assert.equal(code, 'const __sub1 = foo.subscribe(__bind1(__nodes[3]));');
    });

    it('map', () => {
        const binder = getBinder(
            { ast: (() => x + 1).toExpr(), type: MAP },
            { module: 1, element: 3 }
        );
        binder.observables = ['x'];
        const ast = binding(binder, 1);
        const code = generate(ast);
        assert.equal(code, 'const __sub1 = __map(x, x => x + 1, __bind1(__nodes[3]));');
    });

    it('combine', () => {
        const binder = getBinder(
            { ast: (() => x + y).toExpr(), type: MAP },
            { module: 1, element: 3 }
        );
        binder.observables = ['x', 'y'];
        const ast = binding(binder, 1);
        const code = generate(ast);
        assert.equal(code, 'const __sub1 = __combine([x, y], (x, y) => x + y, __bind1(__nodes[3]));');
    });
    
    it('map first', () => {
        const binder = getBinder(
            { ast: (() => x + 1).toExpr(), type: VALUE },
            { module: 1, element: 3 }
        );
        binder.observables = ['x'];
        const ast = binding(binder, 1);
        const code = generate(ast);
        assert.equal(code, 'const __sub1 = __map(x, x => x + 1, __bind1(__nodes[3]), true);');
    });

    it('combine first', () => {
        const binder = getBinder(
            { ast: (() => x + y).toExpr(), type: VALUE },
            { module: 1, element: 3 }
        );
        binder.observables = ['x', 'y'];
        const ast = binding(binder, 1);
        const code = generate(ast);
        assert.equal(code, 'const __sub1 = __combine([x, y], (x, y) => x + y, __bind1(__nodes[3]), true);');
    });

    it('first value', () => {
        const binder = getBinder(
            { ast: (() => x).toExpr(), type: VALUE },
            { module: 1, element: 3 }
        );
        binder.observables = ['x'];
        const ast = binding(binder, 1);
        const code = generate(ast);
        assert.equal(code, 'const __sub1 = __first(x, __bind1(__nodes[3]));');
    });
    
});