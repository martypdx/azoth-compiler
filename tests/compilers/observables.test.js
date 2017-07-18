import createHandler from '../../src/compilers/observables';
import { recursive, base } from 'acorn/dist/walk.es';
import { assert } from 'chai';
import codeEqual from '../helpers/code-equal';

function compile(ast, visitors) {
    const scope = Object.create(null);
    let ref = 0;
    const getRef = () => `__ref${ref++}`;
    const Observables = createHandler({ getRef });

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
    }, Observables);

    recursive(ast, state, handlers);
}

const keyCount = obj => Object.keys(obj).filter(f => f!=='__function').length;

/*eslint no-unused-vars: off */
/* globals _, _1, _2 $ */
describe('observables', () => {

    it('no observables', done => {
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

    it('function parameter observable', () => {

        function source() {
            const template = (name=$, foo, bar=BAR) => _``;
        }

        const ast = source.toAst();

        compile(ast, {
            _(scope) {
                assert.equal(keyCount(scope), 1);
                assert.ok(scope.name);
            }
        });

        codeEqual(ast, expected);

        function expected() {
            const template = (name, foo, bar=BAR) => _``;
        }
    });


    it('not top-level function parameter observable', () => {

        function source() {
            const template = ({ foo=$, bar }) => _``;
        }

        const ast = source.toAst();

        compile(ast, {
            _(scope) {
                assert.equal(keyCount(scope), 1);
                assert.ok(scope.foo);
            }
        });

        codeEqual(ast, expected);

        function expected() {
            const template = ({ foo, bar }) => _``;
        }
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


    /* globals item, BAR */
    it('variable observable', () => {

        function source() {
            const { name=$ } = item;
            const { foo } = item;
            const { bar=BAR } = item;
            const template = _``;
        }

        const ast = source.toAst();

        compile(ast, {
            _(scope) {
                assert.equal(keyCount(scope), 1);
                assert.ok(scope.name);
            }
        });

        codeEqual(ast, expected);

        function expected() {
            const { name } = item;
            const { foo } = item;
            const { bar=BAR } = item;
            const template = _``;
        }
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

});