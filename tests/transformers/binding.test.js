/*eslint no-undef: off */
import { generate } from 'astring';
import getBinder from './getBinder';
import { AT, DOLLAR, STAR, NONE, ELEMENT } from '../../src/parse/sigil-types';
import { block, component, property } from '../../src/binders/targets';
import { assert } from 'chai';
import binding from '../../src/transformers/binding';

describe('transform - binding', () => {

    describe('binding types', () => {

        it('value', () => {
            const binder = getBinder(
                { ast: (() => foo).toExpr(), sigil: NONE },
                { module: 1, element: 1 }
            );
            const [ ast ] = binding(binder, 0);
            const code = generate(ast);
            assert.equal(code, '__bind1(__nodes[1])(foo);');
        });

        it('no map with NONE', () => {
            const binder = getBinder(
                { ast: (() => x + 1).toExpr(), sigil: NONE },
                { module: 1, element: 2, observables: ['x'] }
            );

            const [ ast ] = binding(binder, 1);
            const code = generate(ast);
            assert.equal(code, '__bind1(__nodes[2])(x + 1);');
        });

        it('no combine with NONE', () => {
            const binder = getBinder(
                { ast: (() => x + y).toExpr(), sigil: NONE },
                { module: 1, element: 3, observables: ['x', 'y'] }
            );

            const [ ast ] = binding(binder, 1);
            const code = generate(ast);
            assert.equal(code, '__bind1(__nodes[3])(x + y);');
        });

        it('subscribe', () => {
            const binder = getBinder(
                { ast: (() => foo).toExpr(), sigil: AT },
                { module: 1, element: 3, observables: ['foo'] }
            );

            const [ ast ] = binding(binder, 1);
            const code = generate(ast);
            assert.equal(code, 'const __sub1 = foo.subscribe(__bind1(__nodes[3]));');
        });

        it('first value', () => {
            const binder = getBinder(
                { ast: (() => x).toExpr(), sigil: DOLLAR },
                { module: 1, element: 3, observables: ['x'] }
            );
            const [ ast ] = binding(binder, 1);
            const code = generate(ast);
            assert.equal(code, 'const __sub1 = __first(x, __bind1(__nodes[3]));');
        });

        it('first map', () => {
            const binder = getBinder(
                { ast: (() => x + 1).toExpr(), sigil: DOLLAR },
                { module: 1, element: 3, observables: ['x'] }
            );
            const [ ast ] = binding(binder, 1);
            const code = generate(ast);
            assert.equal(code, 'const __sub1 = __map(x, x => x + 1, __bind1(__nodes[3]), true);');
        });

        it('first combine', () => {
            const binder = getBinder(
                { ast: (() => x + y).toExpr(), sigil: DOLLAR },
                { module: 1, element: 3, observables: ['x', 'y'] }
            );
            const [ ast ] = binding(binder, 1);
            const code = generate(ast);
            assert.equal(code, 'const __sub1 = __combine([x, y], (x, y) => x + y, __bind1(__nodes[3]), true);');
        });

        it('map', () => {
            const binder = getBinder(
                { ast: (() => x + 1).toExpr(), sigil: STAR },
                { module: 1, element: 3, observables: ['x'] }
            );
            const [ ast ] = binding(binder, 1);
            const code = generate(ast);
            assert.equal(code, 'const __sub1 = __map(x, x => x + 1, __bind1(__nodes[3]));');
        });

        it('combine', () => {
            const binder = getBinder(
                { ast: (() => x + y).toExpr(), sigil: STAR },
                { module: 1, element: 3, observables: ['x', 'y'] }
            );
            const [ ast ] = binding(binder, 1);
            const code = generate(ast);
            assert.equal(code, 'const __sub1 = __combine([x, y], (x, y) => x + y, __bind1(__nodes[3]));');
        });
    });

    describe('block bindings', () => {

        it('value', () => {
            const binder = getBinder(
                { ast: (() => foo).toExpr(), target: block, sigil: NONE },
                { module: 1, element: 1 }
            );
            const statements = binding(binder, 0).map(generate);
            assert.deepEqual(statements, [
                'const __sub0b = __bind1(__nodes[1]);',
                '__sub0b.observer(foo);'
            ]);
        });

        it('no map with NONE', () => {
            const binder = getBinder(
                { ast: (() => x + 1).toExpr(), target: block, sigil: NONE },
                { module: 1, element: 2, observables: ['x'] }
            );

            const statements = binding(binder, 1).map(generate);
            assert.deepEqual(statements, [
                'const __sub1b = __bind1(__nodes[2]);',
                '__sub1b.observer(x + 1);'
            ]);
        });

        it('no combine with NONE', () => {
            const binder = getBinder(
                { ast: (() => x + y).toExpr(), target: block, sigil: NONE },
                { module: 1, element: 3, observables: ['x', 'y'] }
            );

            const statements = binding(binder, 1).map(generate);
            assert.deepEqual(statements, [
                'const __sub1b = __bind1(__nodes[3]);',
                '__sub1b.observer(x + y);'
            ]);
        });

        it('subscribe', () => {
            const binder = getBinder(
                { ast: (() => foo).toExpr(), target: block, sigil: AT },
                { module: 1, element: 3, observables: ['foo'] }
            );

            const statements = binding(binder, 1).map(generate);
            assert.deepEqual(statements, [
                'const __sub1b = __bind1(__nodes[3]);',
                'const __sub1 = foo.subscribe(__sub1b.observer);'
            ]);
        });

        it('first value', () => {
            const binder = getBinder(
                { ast: (() => x).toExpr(), target: block, sigil: DOLLAR },
                { module: 1, element: 3, observables: ['x'] }
            );

            const statements = binding(binder, 1).map(generate);
            assert.deepEqual(statements, [
                'const __sub1b = __bind1(__nodes[3]);',
                'const __sub1 = __first(x, __sub1b.observer);'
            ]);
        });

        it('first map', () => {
            const binder = getBinder(
                { ast: (() => x + 1).toExpr(), target: block, sigil: DOLLAR },
                { module: 1, element: 3, observables: ['x'] }
            );

            const statements = binding(binder, 1).map(generate);
            assert.deepEqual(statements, [
                'const __sub1b = __bind1(__nodes[3]);',
                'const __sub1 = __map(x, x => x + 1, __sub1b.observer, true);'
            ]);
        });

        it('first combine', () => {
            const binder = getBinder(
                { ast: (() => x + y).toExpr(), target: block, sigil: DOLLAR },
                { module: 1, element: 3, observables: ['x', 'y'] }
            );

            const statements = binding(binder, 1).map(generate);
            assert.deepEqual(statements, [
                'const __sub1b = __bind1(__nodes[3]);',
                'const __sub1 = __combine([x, y], (x, y) => x + y, __sub1b.observer, true);'
            ]);
        });

        it('map', () => {
            const binder = getBinder(
                { ast: (() => x + 1).toExpr(), target: block, sigil: STAR },
                { module: 1, element: 3, observables: ['x'] }
            );

            const statements = binding(binder, 1).map(generate);
            assert.deepEqual(statements, [
                'const __sub1b = __bind1(__nodes[3]);',
                'const __sub1 = __map(x, x => x + 1, __sub1b.observer);'
            ]);
        });

        it('combine', () => {
            const binder = getBinder(
                { ast: (() => x + y).toExpr(), target: block, sigil: STAR },
                { module: 1, element: 3, observables: ['x', 'y'] }
            );

            const statements = binding(binder, 1).map(generate);
            assert.deepEqual(statements, [
                'const __sub1b = __bind1(__nodes[3]);',
                'const __sub1 = __combine([x, y], (x, y) => x + y, __sub1b.observer);'
            ]);
        });

    });

    describe('component bindings', () => {

        it('component with value prop', () => {
            const binder = getBinder(
                { ast: (() => Component()).toExpr(), target: component, sigil: ELEMENT },
                { module: 0, element: 1 }
            );
            const prop = getBinder(
                { ast: (() => foo).toExpr(), target: property, sigil: NONE },
                { module: 1, name: 'foo' }
            );
            binder.properties = [prop];

            const statements = binding(binder, 0).map(generate);
            assert.deepEqual(statements, [
                'const __sub0b = Component();',
                '__bind1(__sub0b)(foo);',
                '__sub0b.onanchor(__bind0(__nodes[1]));'
            ]);
        });
        
        it('component with MAP prop', () => {
            const binder = getBinder(
                { ast: (() => Component()).toExpr(), target: component, sigil: ELEMENT },
                { module: 0, element: 1 }
            );
            const prop = getBinder(
                { ast: (() => foo).toExpr(), target: property, sigil: STAR },
                { module: 1, name: 'foo', observables: ['foo'] }
            );

            binder.properties = [prop];

            const statements = binding(binder, 0).map(generate);
            assert.deepEqual(statements, [
                'const __sub0b = Component();',
                'const __sub0_0 = foo.subscribe(__bind1(__sub0b));',
                '__sub0b.onanchor(__bind0(__nodes[1]));'
            ]);
        });
        
        it('component with SUBSCRIBE prop', () => {
            const binder = getBinder(
                { ast: (() => Component()).toExpr(), target: component, sigil: ELEMENT },
                { module: 0, element: 1 }
            );
            const prop = getBinder(
                { ast: (() => foo.map(Foo)).toExpr(), target: property, sigil: AT },
                { module: 1, name: 'foo', observables: ['foo'] }
            );

            binder.properties = [prop];

            const statements = binding(binder, 0).map(generate);
            assert.deepEqual(statements, [
                'const __sub0b = Component();',
                'const __sub0_0 = foo.map(Foo).subscribe(__bind1(__sub0b));',
                '__sub0b.onanchor(__bind0(__nodes[1]));'
            ]);
        });

    });
});