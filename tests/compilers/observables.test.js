import createHandler from '../../src/compilers/observables';
import createRefCounter from '../../src/compilers/ref-counter';
import { Module } from '../../src/state/module';
import { recursive, base } from 'acorn/dist/walk.es';
import { assert } from 'chai';
import codeEqual from '../helpers/code-equal';

function compile(ast, visitors) {
    const scope = Object.create(null);
    const Observables = createHandler(createRefCounter());

    const state = new Module();

    const handlers = Object.assign({
        Program(node, state, c) {
            state.currentFn = node;
            c(node, state, 'BlockStatement');
        },

        TaggedTemplateExpression(node, state, c) {
            const { scope } = state;
            const visitor = visitors[node.tag.name];
            if (visitor) visitor(scope);
            base.TaggedTemplateExpression(node, state, c);
        }
    }, Observables);

    recursive(ast, state, handlers);
}

const keyCount = obj => Object.keys(obj).filter(f => f !== '__function').length;

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
            const template = (name=$, foo, bar = BAR) => _``;
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
            const template = (name, foo, bar = BAR) => _``;
        }
    });

    it('destructured param adds statements', () => {
        function source() {
            const template = ({ foo, bar }=$) => _``;
        }

        const ast = source.toAst();

        compile(ast, {
            _(scope) {
                assert.equal(keyCount(scope), 2);
                assert.ok(scope.foo);
                assert.ok(scope.bar);
            }
        });

        codeEqual(ast, expected);

        function expected() {
            const template = __ref0 => {
                const foo = __ref0.child('foo');
                const bar = __ref0.child('bar');
                return _``;
            };
        }
    });

    it('destructured param in function adds statements', () => {
        function source() {
            function qux() {
                const template = ({ foo, bar }=$) => _``;
            }
        }

        const ast = source.toAst();

        compile(ast, {
            _(scope) {
                assert.equal(keyCount(scope), 2);
                assert.ok(scope.foo);
                assert.ok(scope.bar);
            }
        });

        codeEqual(ast, expected);

        function expected() {
            function qux() {
                const template = __ref0 => {
                    const foo = __ref0.child('foo');
                    const bar = __ref0.child('bar');
                    return _``;
                };
            }
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
            const one = (name=$, foo, bar = BAR) => _``;
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
            const { bar = BAR } = item;
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
            const { bar = BAR } = item;
            const template = _``;
        }
    });

    it('destructured variable adds statements', () => {

        function source() {
            const { foo } = item;
            const { bar: { name }=$ } = item;
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
            const { foo } = item;
            const { bar: __ref0 } = item;
            const name = __ref0.child('name');
            const template = _``;
        }
    });

    it('destructured variable in function adds statements', () => {

        function source() {
            function foo() {
                const { foo } = item;
                const { bar: { name }=$ } = item;
                const template = _``;
            }
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
            function foo() {
                const { foo } = item;
                const { bar: __ref0 } = item;
                const name = __ref0.child('name');
                const template = _``;
            }
        }
    });

    it('inner variable masks outer scope', () => {
        function source() {
            const { name=$ } = item;
            const one = name => {
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

    it('var with no init okay', () => {
        function source() {
            var item;
        }
        compile(source.toAst());
    });
});
