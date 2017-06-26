import * as observables from '../../src/compilers/observables';
import { recursive, base } from 'acorn/dist/walk.es';
import { assert } from 'chai';

function compile(ast, visitors) {
    const scope = Object.create(null);
    const state = { 
        scope,
        functionScope: scope 
    };

    const handlers = Object.assign({
        TaggedTemplateExpression(node, state, c) {
            const { scope } = state;
            const visitor = visitors[node.tag.name];
            if(visitor) visitor(scope);
            base.TaggedTemplateExpression(node, state, c);
        }
    }, observables);

    recursive(ast, state, handlers);
}

const keyCount = obj => Object.keys(obj).filter(f => f!=='__function').length;

/*eslint no-unused-vars: off */
/* globals _, _1, _2 $ */
describe('compiler', () => {

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

    it('nested scopes', () => {
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

    it('var function scoped, but not hoisted', () => {
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
                // NOTE: if hoisting would be supported,
                // _1`` below should have "name" in scope.
                // Destructure has to be init-ed though,
                // which means value wouldn't exist.
                // So doesn't seem something that needs to be supported
                assert.notOk(scope.name);
            }
        });
    });

    // TODO: log warning
    it('nested =$ ignored', done => {

        function source() {
            const { outer: { name=$ } } = item;
            _``;
        }

        compile(source.toAst(), {
            _(scope) {
                assert.notOk(scope.name);
                done();
            }
        });
    });
  

});