// import scope from '../../src/compilers/scope';
import { simple, base } from 'acorn/dist/walk.es';
import { generate } from 'astring';
import { assert } from 'chai';

const IDENTIFIER = '$';

function compile(ast, initialState) {

    simple(ast, {
        TaggedTemplateExpression(node, state) {
            state.found = !!state.scope.name;
        },
        VariableDeclaration(node, { scope }) {
            scope.variable = true;
        },
        AssignmentPattern(node, { scope }) {
            if(node.right.name!==IDENTIFIER) return;
            scope[node.left.name] = true;
        }
    }, base, initialState);

}

/*eslint no-unused-vars: off */
/* globals _, $ */

describe.only('compiler', () => {

    it('no import', () => {
        function source() {
            const template = name => _``;
        }

        const scope = {};
        const ast = source.toAst();

        compile(ast, { scope });
        assert.ok(scope.variable);
    });


    /* globals item, BAR */
    it('find observable', () => {

        function source() {
            const { name=$ } = item;
            const { foo=BAR } = item;
            const template = _``;
        }

        const scope = {};
        const state = { scope };
        const ast = source.toAst();

        compile(ast, state);
        assert.ok(scope.name);
        assert.notOk(scope.foo);

        assert.ok(state.found);
    });



  

});