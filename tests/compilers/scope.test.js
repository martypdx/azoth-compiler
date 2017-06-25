// import scope from '../../src/compilers/scope';
import { recursive, base } from 'acorn/dist/walk.es';
import { generate } from 'astring';
import { assert } from 'chai';

const IDENTIFIER = '$';

function compile(ast, visitors) {
    const scope = Object.create(null);
    const state = { 
        scope,
        functionScope: scope 
    };

    recursive(ast, state, {
        TaggedTemplateExpression(node, state, c) {
            console.log('TTE');
            const { scope } = state;
            const visitor = visitors[node.tag.name];
            if(visitor) visitor(scope);
            base.TaggedTemplateExpression(node, state, c);
        },
        Function(node, state, c) {
            console.log('Function');
            const { scope, functionScope } = state;
            state.scope = state.functionScope = Object.create(scope);
            base.Function(node, state, c);
            state.scope = scope;
            state.functionScope = functionScope;
        },
        AssignmentPattern(node, { scope, functionScope, declaration }) {
            console.log('AssignmentPattern', node.left.name, declaration);
            if(node.right.name!==IDENTIFIER) return;
            const addTo = declaration === 'var' ? functionScope : scope;
            addTo[node.left.name] = true;
        },
        VariableDeclaration(node, state, c) {
            state.declaration = node.kind;
            base.VariableDeclaration(node, state, c);
            state.declaration = null;
        },
        VariablePattern({ name }, { scope }) {
            console.log('VariablePattern', name);
            if(scope[name]) scope[name] = false;
        },
        BlockStatement(node, state, c) {
            console.log('BlockStatement');
            const { scope } = state;
            state.scope = Object.create(scope);
            base.BlockStatement(node, state, c);
            state.scope = scope;
        }
    }, base);

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

    it('parameter not in scope for function sibling', () => {
        function source() {
            const one = (name=$, foo, bar=BAR) => _``;
            const two = qux => _1``;
        }

        compile(source.toAst(), {
            _(scope) {
                assert.ok(scope.name);
            },
            _1(scope) {
                assert.notOk(scope.name);
            }
        });
    });

    it('inner variable masks outer scope', () => {
        function source() {
            const { name=$ } = item;
            const one = (name) => {
                return _``;
            };
            const template = _1``;
        }

        compile(source.toAst(), {
            _(scope) {
                assert.notOk(scope.name);
            },
            _1(scope) {
                assert.ok(scope.name);
            }
        });
    });

    it('through nested templates', () => {
        function source() {
            const template = (items=$) => _`
                ${items.map((item=$) => _1`${item} of ${items.length}`)}
            `;
        }

        compile(source.toAst(), {
            _(scope) {
                assert.ok(scope.items);
                assert.notOk(scope.item);
            },
            _1(scope) {
                assert.ok(scope.items);
                assert.ok(scope.item);
            }
        });
    });

    it('block scope', () => {
        function source() {
            _1``;
            {
                const { name=$ } = item;
                _``;
            }
            _1``;
        }

        compile(source.toAst(), {
            _(scope) {
                assert.ok(scope.name);
            },
            _1(scope) {
                assert.notOk(scope.name);
            }
        });
    });

    // NOTE: if hoisting would be supported,
    // _1`` below should have "name" in scope.
    // Destructure has to be init-ed though,
    // so doesn't seem something that needs to be supported
    it('var survives block, but not hoisted', () => {
        function source() {
            _1``;
            {
                var { name=$ } = item;
                _``;
            }
            _``;
        }

        compile(source.toAst(), {
            _(scope) {
                assert.ok(scope.name);
            },
            _1(scope) {
                assert.notOk(scope.name);
            }
        });
    });


  

});