import makeObservables from '../../src/compilers/observables-from';
import { recursive } from 'acorn/dist/walk.es';
import { assert } from 'chai';
import codeEqual from '../helpers/code-equal';
import { generate } from '../../src/ast';

const makeRef = () => {
    let counter = 0;
    return () => `__ref${counter++}`;
};

function test(expected) {
    const ast = expected.source.toAst();
    const getRef = makeRef();

    const { observables, statements, identifiers } = compile(ast, getRef);
    assert.deepEqual(observables, expected.observables || [], 'observables');
    assert.deepEqual(identifiers, expected.identifiers || [], 'identifiers');
    codeEqual(ast, expected.ast);
    if(expected.statements) {
        codeEqual({ type: 'Program', body: statements }, expected.statements);
    }
}
    
function compile(ast, getRef) {
    const observables = [];
    const statements = [];
    const identifiers = [];
    const state = { 
        addObservable(o) { observables.push(o); },
        addStatements(s) { statements.push(...s); },
        addIdentifier(i) { identifiers.push(i); }
    };
    
    const compileObservables = makeObservables({ getRef });

    recursive(ast, state, {
        Function(node, state, c) {
            node.params = node.params.map(node => compileObservables(node, state));
        },
        VariableDeclarator(node, state, c) {
            node.id = compileObservables(node.id, state);
        }
    });

    return { observables, statements, identifiers };
}


/*eslint no-unused-vars: off, quotes: off */
/* globals _, bar, qux, id, __ref0 $ */
describe('observables from', () => {

    describe('parameters', () => {

        it('foo', () =>  test({
            source: () => { foo => {}; },
            identifiers: ['foo'],
            ast: () => { foo => {}; }
        }));

        it('foo=$', () => test({
            source: () => { 
                (foo=$) => {}; 
            },
            observables: ['foo'],
            ast: () => { 
                foo => {}; 
            }
        }));

        it('{ foo }=$', () => test({
            source: () => { ({ foo }=$) => {}; },
            observables: ['foo'],
            ast: () => { __ref0 => {}; },
            statements: () => {
                const foo = __ref0.child("foo");
            }
        }));

        it('{ foo: { bar } }=$', () => test({
            source: () => { ({ foo: { bar } }=$) => {}; },
            observables: ['bar'],
            ast: () => { __ref0 => {}; },
            statements: () => {
                const __ref1 = __ref0.child("foo");
                const bar = __ref1.child("bar");
            }
        }));

        it('{ foo=$ }', () => test({
            source: () => { ({ foo=$ }) => {}; },
            observables: ['foo'],
            ast: () => { ({ foo }) => {}; }
        }));

        it('foo=$, bar', () => test({
            source: () => { (foo=$, bar) => {}; },
            observables: ['foo'],
            identifiers: ['bar'],
            ast: () => { (foo, bar) => {}; }
        }));

        it('{ foo=$, bar }', () => test({
            source: () => { ({ foo=$, bar }) => {}; },
            observables: ['foo'],
            identifiers: ['bar'],
            ast: () => { ({ foo, bar }) => {}; }
        }));
       
        it('{ foo: { bar=$ } }', () => test({
            source: () => { ({ foo: { bar=$ } }) => {}; },
            observables: ['bar'],
            ast: () => { ({ foo: { bar } }) => {}; }
        }));

        it('{ foo: { bar }=$ }', () => test({
            source: () => { ({ foo: { bar }=$ }) => {}; },
            observables: ['bar'],
            ast: () => { ({ foo: __ref0 }) => {}; },
            statements: () => {
                const bar = __ref0.child("bar");
            }
        }));

        it('{ foo: bar=$ }', () => test({
            source: () => { ({ foo: bar=$ }) => {}; },
            observables: ['bar'],
            ast: () => { ({ foo: bar }) => {}; }
        }));
        
        it('[ foo ]=$', () => test({
            source: () => { ([ foo ]=$) => {}; },
            observables: ['foo'],
            ast: () => { __ref0 => {}; },
            statements: () => {
                const foo = __ref0.child(0);
            }
        }));
        
        it('[, foo ]=$', () => test({
            source: () => { ([, foo ]=$) => {}; },
            observables: ['foo'],
            ast: () => { __ref0 => {}; },
            statements: () => {
                const foo = __ref0.child(1);
            }
        }));
        
        it('[ [ foo ]=$ ]', () => test({
            source: () => { ([ [ foo ]=$ ]) => {}; },
            observables: ['foo'],
            ast: () => { ([ __ref0 ]) => {}; },
            statements: () => {
                const foo = __ref0.child(0);
            }
        }));

        it('{ [id]: bar }=$', () => test({
            source: () => { ({ [id]: bar }=$) => {}; },
            observables: ['bar'],
            ast: () => { __ref0 => {}; },
            statements: () => {
                const bar = __ref0.child(id);
            }
        }));
        
        it('{ foo: { bar: { qux=$ } } }', () => test({
            source: () => { ({ foo: { bar: { qux=$ } } }) => {}; },
            observables: ['qux'],
            ast: () => { ({ foo: { bar: { qux } } }) => {}; }
        }));
        
    });

    describe('variables', () => {

        it('foo', () => test({
            source: () => { const foo = qux; },
            identifiers: ['foo'],
            ast: () => {const foo = qux; }
        }));

        it('{ foo=$ }', () => test({
            source: () => { const { foo=$ } = qux; },
            observables: ['foo'],
            ast: () => { const { foo } = qux; }
        }));
        
        it('{ foo: bar=$ }', () => test({
            source: () => { const { foo: bar=$ } = qux; },
            observables: ['bar'],
            ast: () => { const { foo: bar } = qux; }
        }));
        
        it('{ foo: { bar=$ } }', () => test({
            source: () => { const { foo: { bar=$ } } = qux; },
            observables: ['bar'],
            ast: () => { const { foo: { bar } } = qux; }
        }));
        
        it('{ foo: { bar }=$ }', () => test({
            source: () => { 
                const { foo: { bar }=$ } = qux; 
            },
            observables: ['bar'],
            ast: () => { 
                const { foo: __ref0 } = qux; 
            },
            statements: () => {
                const bar = __ref0.child("bar");
            }
        }));
        
        it('[ [ foo ]=$ ]', () => test({
            source: () => { const [ [ foo ]=$ ] = qux; },
            observables: ['foo'],
            ast: () => { const [ __ref0 ] = qux; },
            statements: () => {
                const foo = __ref0.child(0);
            }
        }));
        
        it('{ [id]: bar=$ }', () => test({
            source: () => { const { [id]: bar=$ } = qux; },
            observables: ['bar'],
            ast: () => { const { [id]: bar } = qux; }
        }));
    });

    describe('normal and mixed assignment pattern', () => {

        it('foo="BAR"', () => test({
            source: () => { (foo='BAR') => {}; },
            identifiers: ['foo'],
            ast: () => { (foo='BAR') => {}; }
        }));
        
        it('{ foo="BAR" }', () => test({
            source: () => { const { foo='BAR' } = qux; },
            identifiers: ['foo'],
            ast: () => { const { foo='BAR' } = qux; }
        }));

        it('{ foo=$ }={}', () => test({
            source: () => { ({ foo=$ }={}) => {}; },
            observables: ['foo'],
            ast: () => { ({ foo }={}) => {}; }
        }));
    });

    describe('disallowed destructuring', () => {
        
        it('repeat =$ is error', () => {
            try {
                test({
                    source: () => { ({ foo=$ }=$) => {}; },
                    observables: [],
                    ast: () => { __ref0 => {}; }
                });
            }
            catch(err) {
                return;
            }
            throw new Error('Expected Exception'); 

        });

        // TODO: probably need to disallow RestSpread
    });
});