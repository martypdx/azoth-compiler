// import scope from '../../src/compilers/scope';
import { simple, base } from 'acorn/dist/walk.es';
import { generate } from 'astring';
import { assert } from 'chai';

const IDENTIFIER = '$';

function compile(ast, visitors) {
    const scope = { __function: null };
    scope.__function = scope;

    simple(ast, {
        TaggedTemplateExpression(node, { scope }) {
            const visitor = visitors[node.tag.name];
            if(visitor) visitor(scope);
        },
        Function(node, state) {
            console.log('function!', node.type);
        },
        VariableDeclaration(node, { scope }) {
            
        },
        AssignmentPattern(node, { scope }) {

            console.log('pattern', node.type);
            if(node.right.name!==IDENTIFIER) return;
            scope[node.left.name] = true;
        }
    }, base, { scope });

}

/*eslint no-unused-vars: off */
/* globals _, _1, _2 $ */

const keyCount = obj => Object.keys(obj).filter(f => f!=='__function').length;

describe.only('compiler', () => {

    it('no import', done => {
        function source() {
            const template = name => _``;
        }

        compile(source.toAst(), {
            _(scope) {
                assert.equal(keyCount(scope), 0);
                done();
            }
        });
    });


    /* globals item, BAR */
    it('find observable', done => {

        function source() {
            const { name=$ } = item;
            const { foo } = item;
            const { bar=BAR } = item;
            const template = _``;
        }

        compile(source.toAst(), {
            _(scope) {
                assert.equal(keyCount(scope), 1);
                assert.ok(scope.name);
                done();
            }
        });
    });

    it('function parameter observable', done => {

        function source() {
            const template = (name=$, foo, bar=BAR) => _``;
        }

        compile(source.toAst(), {
            _(scope) {
                assert.equal(keyCount(scope), 1);
                assert.ok(scope.name);
                done();
            }
        });
    });

    it.skip('parameter not in scope for function sibling', done => {
        function source() {
            const one = (name=$, foo, bar=BAR) => _``;
            const two = qux => _1``;
        }

        compile(source.toAst(), {
            _(scope) {
                assert.equal(keyCount(scope), 1);
                assert.ok(scope.name);
            },
            _1(scope) {
                assert.equal(keyCount(scope), 0);
            }
        });
    });



  

});