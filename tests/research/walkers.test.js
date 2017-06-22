/*eslint no-undef: off */
import chai from 'chai';
const assert = chai.assert;
import { recursive, simple, base } from 'acorn/dist/walk.es';

function full(node, callback, b = base, state, override) {
    (function c(node, st, override) {
        let type = override || node.type;
        b[type](node, st, c);
        callback(node, st, type);
    })(node, state, override);
}


describe.skip('walkers', () => {


    it('recursive', () => {
        function source () {
            function first(foo) {
                const bar = (x, y) => _`<span>*${x + y}</span>`;
            }
        }

        const ast = source.toAst();

        let scope = null;
         
        recursive(ast, scope = {}, {
            Function(node, state, c) {
                const params = node.params.reduce((obj, p) => {
                    obj[p.name] = true;
                    return obj;
                }, {});
                state = Object.assign(state, params);
                base.Function(node, state, c);
            },
            TaggedTemplateExpression(node, state) {
                scope = state;
            }
        });

        assert.deepEqual(scope, { foo: true, x: true, y: true });
    });

    it.skip('simple', () => {
        function source () {
            function first(foo) {
                const bar = (x, y) => _`<span>*${x + y}</span>`;
            }
        }

        const ast = source.toAst();

        const called = [];
         
        simple(ast, {
            Function(node, state) {
                state.push([node.type, node.id  && node.id.name, node.params.length]);
            }
        }, undefined, called);

        assert.deepEqual(called, []);
    });

    it.skip('full', () => {
        function source () {
            function first(foo) {
                const bar = (x, y) => _`<span>*${x + y}</span>`;
            }
        }

        const ast = source.toAst();

        const called = [];
            
        full(ast, (node, st, type) => {
            st.push(type);
        }, null, called);

        assert.deepEqual(called, []);
    });

});