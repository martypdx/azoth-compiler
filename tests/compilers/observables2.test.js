import { observables } from '../../src/compilers/observables2';
import { recursive } from 'acorn/dist/walk.es';
import { assert } from 'chai';
import codeEqual from '../helpers/code-equal';
import { generate } from '../../src/ast';

function compile(ast) {
    let ref = 0;
    const getRef = () => `__ref${ref++}`;
    const state = { 
        observables: [],
        destructure: null,
        params: null,
        getRef
    };
    
    recursive(ast, state, {
        Function(node, state, c) {
            node.params = node.params.map(node => observables(node, state));
        },
        VariableDeclarator(node, state, c) {
            node.id = observables(node.id, state, c);
        }
    });
    return state;
}

/*eslint no-unused-vars: off, quotes: off */
/* globals _, bar, qux, id $ */
describe.only('observables', () => {

    describe('parameters', () => {

        it('none', () => {
            function source() {
                foo => {};
            }
            const ast = source.toAst();
            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, []);

            codeEqual(ast, expected);
            function expected() {
                foo => {};
            }

            assert.equal(destructure, null);
        });

        it('foo=$', () => {
            function source() {
                (foo=$) => {};
            }
            const ast = source.toAst();
            const { observables, destructure } = compile(ast);

            assert.deepEqual(observables, ['foo']);

            codeEqual(ast, expected);
            function expected() {
                foo => {};
            }

            assert.equal(destructure, null);
        });

        it('{ foo }=$', () => {
            function source() {
                ({ foo }=$) => {};
            }
            const ast = source.toAst();

            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, []);

            codeEqual(ast, expected);
            function expected() {
                __ref0 => {};
            }
            
            assert.equal(generate(destructure), '{foo}');
        });

        it('{ foo=$ }', () => {
            function source() {
                ({ foo=$ }) => {};
            }
            const ast = source.toAst();

            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, ['foo']);
            codeEqual(ast, expected);

            function expected() {
                ({ foo }) => {};
            }

            assert.equal(destructure, null);
            
        });

        it('{ foo: { bar } }=$', () => {
            function source() {
                ({ foo: { bar } }=$) => {};
            }
            const ast = source.toAst();

            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, []);
            codeEqual(ast, expected);

            function expected() {
                __ref0 => {};
            }

            assert.equal(generate(destructure), '{foo: {bar}}');
            
        });

        it('{ foo: { bar=$ } }', () => {
            function source() {
                ({ foo: { bar=$ } }) => {};
            }
            const ast = source.toAst();

            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, ['bar']);
            codeEqual(ast, expected);

            function expected() {
                ({ foo: { bar } }) => {};
            }

            assert.equal(destructure, null);
            
        });

        it('{ foo: { bar }=$ }', () => {
            function source() {
                ({ foo: { bar }=$ }) => {};
            }
            const ast = source.toAst();

            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, []);
            codeEqual(ast, expected);

            function expected() {
                ({ foo: __ref0 }) => {};
            }

            assert.equal(generate(destructure), '{bar}');
            
        });

        it('{ foo: bar=$ }', () => {
            function source() {
                ({ foo: bar=$ }) => {};
            }
            const ast = source.toAst();

            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, ['bar']);
            codeEqual(ast, expected);

            function expected() {
                ({ foo: bar }) => {};
            }

            assert.equal(destructure, null);
            
        });

        it('[ foo ]=$', () => {
            function source() {
                ([ foo ]=$) => {};
            }
            const ast = source.toAst();

            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, []);

            codeEqual(ast, expected);
            function expected() {
                __ref0 => {};
            }
            
            assert.equal(generate(destructure), '[foo]');
        });

        it('[ [ foo ]=$ ]', () => {
            function source() {
                ([ [ foo ]=$ ]) => {};
            }
            const ast = source.toAst();

            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, []);

            codeEqual(ast, expected);
            function expected() {
                ([ __ref0 ]) => {};
            }
            
            assert.equal(generate(destructure), '[foo]');
        });

        it('{ [id]: bar }=$', () => {
            function source() {
                ({ [id]: bar }=$) => {};
            }
            const ast = source.toAst();
            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, []);

            codeEqual(ast, expected);
            function expected() {
                __ref0 => {};
            }

            assert.equal(generate(destructure), '{[id]: bar}');
        });

        it('{ foo: { bar: { qux=$ } } }', () => {
            function source() {
                ({ foo: { bar: { qux=$ } } }) => {};
            }
            const ast = source.toAst();

            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, ['qux']);
            codeEqual(ast, expected);

            function expected() {
                ({ foo: { bar: { qux } } }) => {};
            }

            assert.equal(destructure, null);
            
        });
    });

    describe('variables', () => {

        it('none', () => {
            function source() {
                const foo = qux;
            }
            const ast = source.toAst();
            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, []);

            codeEqual(ast, expected);
            function expected() {
                const foo = qux;
            }

            assert.equal(destructure, null);
        });

        it('{ foo=$ }', () => {
            function source() {
                const { foo=$ } = qux;
            }
            const ast = source.toAst();
            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, ['foo']);
            codeEqual(ast, expected);

            function expected() {
                const { foo } = qux;
            }

            assert.equal(destructure, null);
            
        });

        it('{ foo: bar=$ }', () => {
            function source() {
                const { foo: bar=$ } = qux;
            }
            const ast = source.toAst();
            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, ['bar']);
            codeEqual(ast, expected);

            function expected() {
                const { foo: bar } = qux;
            }

            assert.equal(destructure, null);
        });

        it('{ foo: { bar=$ } }', () => {
            function source() {
                const { foo: { bar=$ } } = qux;
            }
            const ast = source.toAst();

            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, ['bar']);
            codeEqual(ast, expected);

            function expected() {
                const { foo: { bar } } = qux;
            }

            assert.equal(destructure, null);
            
        });

        it('{ foo: { bar }=$ }', () => {
            function source() {
                const { foo: { bar }=$ } = qux;
            }
            const ast = source.toAst();

            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, []);
            codeEqual(ast, expected);

            function expected() {
                const { foo: __ref0 } = qux;
            }

            assert.equal(generate(destructure), '{bar}');
            
        });

        it('[ [ foo ]=$ ]', () => {
            function source() {
                const [ [ foo ]=$ ] = qux;
            }
            const ast = source.toAst();

            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, []);

            codeEqual(ast, expected);
            function expected() {
                const [ __ref0 ] = qux;
            }
            
            assert.equal(generate(destructure), '[foo]');
        });

        it('{ [id]: bar=$ }', () => {
            function source() {
                const { [id]: bar=$ } = qux;
            }
            const ast = source.toAst();
            const { observables, destructure } = compile(ast);
            assert.deepEqual(observables, ['bar']);

            codeEqual(ast, expected);
            function expected() {
                const { [id]: bar } = qux;
            }

            assert.equal(destructure, null);
        });

    });


    // describe('normal destructing intact', () => {

    //     it('none', () => {
    //         function source() {
    //             foo => {};
    //         }
    //         const ast = source.toAst();
    //         const { observables, destructure } = compile(ast);
    //         assert.deepEqual(observables, []);

    //         codeEqual(ast, expected);
    //         function expected() {
    //             foo => {};
    //         }

    //         assert.equal(destructure, null);
    //     });
    // });
});