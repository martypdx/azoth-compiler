import { observables } from '../../src/compilers/observables2';
import { toStatements } from '../../src/compilers/destructured';
import { recursive } from 'acorn/dist/walk.es';
import { assert } from 'chai';
import codeEqual from '../helpers/code-equal';
import { generate } from '../../src/ast';

const makeRef = () => {
    let counter = 0;
    return () => `__ref${counter++}`;
};

function test({ 
    source, 
    observables: expectedObservables, 
    expected: expectedAst, 
    destructured: expectedDestructured,
    statements: expectedStatements,
    shouldThrow = false
}) {
    const ast = source.toAst();
    const getRef = makeRef();
    const { observables, destructured, statements } = compile(ast, getRef);
    assert.deepEqual(observables, expectedObservables);

    codeEqual(ast, expectedAst);

    if(expectedDestructured) {
        assert.equal(destructured.length, 1);
        const [{ ref, node }] = destructured;
        assert.equal(generate(node), expectedDestructured);
        assert.equal(ref.name, '__ref0');

        let body = null;
        try {
            body = toStatements(node, { ref, getRef });
        }
        catch(err) {
            if(shouldThrow) return;
            throw err;
        }
        if(shouldThrow) throw new Error('Expected Exception');
        codeEqual({ type: 'Program', body }, expectedStatements);
    } 
}
    
function compile(ast, getRef) {
    const state = { 
        observables: [],
        destructured: []
    };
    
    const compileObservables = observables({ getRef });

    recursive(ast, state, {
        Function(node, state, c) {
            node.params = node.params.map(node => compileObservables(node, state));
        },
        VariableDeclarator(node, state, c) {
            node.id = compileObservables(node.id, state);
        }
    });

    return state;
}


/*eslint no-unused-vars: off, quotes: off */
/* globals _, bar, qux, id, __ref0 $ */
describe.only('observables', () => {

    describe('parameters', () => {

        it('none', () =>  test({
            source: () => { 
                foo => {}; 
            },
            observables: [],
            expected: () => { 
                foo => {}; 
            }
        }));

        it('foo=$', () => test({
            source: () => { 
                (foo=$) => {}; 
            },
            observables: ['foo'],
            expected: () => { 
                foo => {}; 
            }
        }));

        it('{ foo }=$', () => test({
            source: () => { ({ foo }=$) => {}; },
            observables: [],
            expected: () => { __ref0 => {}; },
            destructured: '{foo}',
            statements: () => {
                const foo = __ref0.child("foo");
            }
        }));

        it('{ foo: { bar } }=$', () => test({
            source: () => { ({ foo: { bar } }=$) => {}; },
            observables: [],
            expected: () => { __ref0 => {}; },
            destructured: '{foo: {bar}}',
            statements: () => {
                const __ref1 = __ref0.child("foo");
                const bar = __ref1.child("bar");
            }
        }));

        it('{ foo=$ }', () => test({
            source: () => { ({ foo=$ }) => {}; },
            observables: ['foo'],
            expected: () => { ({ foo }) => {}; }
        }));
       
        it('{ foo: { bar=$ } }', () => test({
            source: () => { ({ foo: { bar=$ } }) => {}; },
            observables: ['bar'],
            expected: () => { ({ foo: { bar } }) => {}; }
        }));

        it('{ foo: { bar }=$ }', () => test({
            source: () => { ({ foo: { bar }=$ }) => {}; },
            observables: [],
            expected: () => { ({ foo: __ref0 }) => {}; },
            destructured: '{bar}',
            statements: () => {
                const bar = __ref0.child("bar");
            }
        }));

        it('{ foo: bar=$ }', () => test({
            source: () => { ({ foo: bar=$ }) => {}; },
            observables: ['bar'],
            expected: () => { ({ foo: bar }) => {}; }
        }));
        
        it('[ foo ]=$', () => test({
            source: () => { ([ foo ]=$) => {}; },
            observables: [],
            expected: () => { __ref0 => {}; },
            destructured: '[foo]',
            statements: () => {
                const foo = __ref0.child(0);
            }
        }));
        
        it('[, foo ]=$', () => test({
            source: () => { ([, foo ]=$) => {}; },
            observables: [],
            expected: () => { __ref0 => {}; },
            destructured: '[, foo]',
            statements: () => {
                const foo = __ref0.child(1);
            }
        }));
        
        it('[ [ foo ]=$ ]', () => test({
            source: () => { ([ [ foo ]=$ ]) => {}; },
            observables: [],
            expected: () => { ([ __ref0 ]) => {}; },
            destructured: '[foo]',
            statements: () => {
                const foo = __ref0.child(0);
            }
        }));

        it('{ [id]: bar }=$', () => test({
            source: () => { ({ [id]: bar }=$) => {}; },
            observables: [],
            expected: () => { __ref0 => {}; },
            destructured: '{[id]: bar}',
            statements: () => {
                const bar = __ref0.child(id);
            }
        }));
        
        it('{ foo: { bar: { qux=$ } } }', () => test({
            source: () => { ({ foo: { bar: { qux=$ } } }) => {}; },
            observables: ['qux'],
            expected: () => { ({ foo: { bar: { qux } } }) => {}; }
        }));
        
    });

    describe('variables', () => {

        it('none', () => test({
            source: () => { const foo = qux; },
            observables: [],
            expected: () => {const foo = qux; }
        }));

        it('{ foo=$ }', () => test({
            source: () => { const { foo=$ } = qux; },
            observables: ['foo'],
            expected: () => { const { foo } = qux; }
        }));
        
        it('{ foo: bar=$ }', () => test({
            source: () => { const { foo: bar=$ } = qux; },
            observables: ['bar'],
            expected: () => { const { foo: bar } = qux; }
        }));
        
        it('{ foo: { bar=$ } }', () => test({
            source: () => { const { foo: { bar=$ } } = qux; },
            observables: ['bar'],
            expected: () => { const { foo: { bar } } = qux; }
        }));
        
        it('{ foo: { bar }=$ }', () => test({
            source: () => { 
                const { foo: { bar }=$ } = qux; 
            },
            observables: [],
            expected: () => { 
                const { foo: __ref0 } = qux; 
            },
            destructured: '{bar}',
            statements: () => {
                const bar = __ref0.child("bar");
            }
        }));
        
        it('[ [ foo ]=$ ]', () => test({
            source: () => { const [ [ foo ]=$ ] = qux; },
            observables: [],
            expected: () => { const [ __ref0 ] = qux; },
            destructured: '[foo]',
            statements: () => {
                const foo = __ref0.child(0);
            }
        }));
        
        it('{ [id]: bar=$ }', () => test({
            source: () => { const { [id]: bar=$ } = qux; },
            observables: ['bar'],
            expected: () => { const { [id]: bar } = qux; }
        }));
    });

    describe('normal and mixed assignment pattern', () => {

        it('foo="BAR"', () => test({
            source: () => { (foo='BAR') => {}; },
            observables: [],
            expected: () => { (foo='BAR') => {}; }
        }));

        it('{ foo=$ }={}', () => test({
            source: () => { ({ foo=$ }={}) => {}; },
            observables: ['foo'],
            expected: () => { ({ foo }={}) => {}; }
        }));
    });

    describe('disallowed destructuring', () => {
        
        it('repeat =$ is error', () => test({
            source: () => { ({ foo=$ }=$) => {}; },
            observables: [],
            expected: () => { __ref0 => {}; },
            destructured: '{foo = $}',
            shouldThrow: true
        }));
    });
});