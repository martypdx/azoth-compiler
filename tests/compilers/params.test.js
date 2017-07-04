import { params } from '../../src/compilers/params';
import { recursive } from 'acorn/dist/walk.es';
import { assert } from 'chai';
import codeEqual from '../helpers/code-equal';

function compile(ast) {
    let ref = 0;
    const getRef = () => `__ref${ref++}`;
    const state = { observables: null };
    
    recursive(ast, state, {
        Function(node, state, c) {
            state.observables = params(node, getRef);
        }
    });
    return state.observables;
}

/*eslint no-unused-vars: off, quotes: off */
/* globals _, _1, _2 $ */
describe('params', () => {

    it('direct identifier', () => {
        function source() {
            (name=$) => {};
        }
        const ast = source.toAst();
        const observables = compile(ast);
        assert.deepEqual(observables, ['name']);

        codeEqual(ast, expected);
        function expected() {
            name => {};
        }
    });

    it('destructured object property (before other statements)', () => {
        function source() {
            ({ name }=$) => { const x = 0; };
        }
        const ast = source.toAst();
        const observables = compile(ast);

        assert.deepEqual(observables, ['name']);

        codeEqual(ast, expected);

        function expected() {
            __ref0 => {
                const name = __ref0.child("name");
                const x = 0;
            };
        }
    });

    it('destructured array property', () => {
        function source() {
            ([ name ]=$) => {};
        }
        const ast = source.toAst();
        const observables = compile(ast);

        assert.deepEqual(observables, ['name']);

        codeEqual(ast, expected);

        function expected() {
            __ref0 => {
                const name = __ref0.child(0);
            };
        }
    });

    it('destructured array property with hole', () => {
        function source() {
            ([, name ]=$) => {};
        }
        const ast = source.toAst();
        const observables = compile(ast);

        assert.deepEqual(observables, ['name']);

        codeEqual(ast, expected);

        function expected() {
            __ref0 => {
                const name = __ref0.child(1);
            };
        }
    });

    it('adds function block', () => {
        function source() {
            ({ x }=$) => x*x;
        }
        const ast = source.toAst();
        const observables = compile(ast);

        assert.deepEqual(observables, ['x']);

        codeEqual(ast, expected);

        function expected() {
            __ref0 => {
                const x = __ref0.child("x");
                return (x * x);
            };
        }
    });

    it('multiple properties', () => {
        function source() {
            ({ foo, bar }=$) => {};
        }
        const ast = source.toAst();
        const observables = compile(ast);

        assert.deepEqual(observables, ['foo', 'bar']);

        codeEqual(ast, expected);

        function expected() {
            __ref0 => {
                const foo = __ref0.child("foo");
                const bar = __ref0.child("bar");
            };
        }
    });

    it('aliased property', () => {
        function source() {
            ({ foo: bar }=$) => {};
        }
        const ast = source.toAst();
        const observables = compile(ast);

        assert.deepEqual(observables, ['bar']);

        codeEqual(ast, expected);

        function expected() {
            __ref0 => {
                const bar = __ref0.child("foo");
            };
        }
    });

    it('nested destructured', () => {
        function source() {
            ({ foo: { bar: { qux } } }=$) => {};
        }
        const ast = source.toAst();
        const observables = compile(ast);

        assert.deepEqual(observables, ['qux']);

        codeEqual(ast, expected);

        function expected() {
            __ref0 => {
                const __ref1 = __ref0.child("foo");
                const __ref2 = __ref1.child("bar");
                const qux = __ref2.child("qux");
            };
        }
    });

    it('complex object destructuring', () => {
        function source() {
            ({ one, two: { five: { six: seven, eight: nine, ten } }, three: four }=$) => {};
        }
        const ast = source.toAst();
        const observables = compile(ast);

        assert.deepEqual(observables, ['one', 'seven', 'nine', 'ten', 'four']);

        codeEqual(ast, expected);

        function expected() {
            __ref0 => {
                const one = __ref0.child("one");
                const __ref1 = __ref0.child("two");
                const __ref2 = __ref1.child("five");
                const seven = __ref2.child("six");
                const nine = __ref2.child("eight");
                const ten = __ref2.child("ten");
                const four = __ref0.child("three");
            };
        }
    });

    it('complex mixed array/object destructuring', () => {
        function source() {
            ({ foo: [ { bar } ] }=$) => {};
        }
        const ast = source.toAst();
        const observables = compile(ast);

        assert.deepEqual(observables, ['bar']);

        codeEqual(ast, expected);

        function expected() {
            __ref0 => {
                const __ref1 = __ref0.child("foo");
                const __ref2 = __ref1.child(0);
                const bar = __ref2.child("bar");
            };
        }
    });

  

});