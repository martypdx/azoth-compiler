/* eslint no-unused-vars: off */
/* globals _ */
import { assert } from 'chai';
import getTaggedTemplates from '../src/get-tagged-templates';
import getScope from '../src/get-scope';

const getTemplates = source => getTaggedTemplates(source.toAst());

describe('get scope for tagged template', () => {

    describe('simple top-level', () => {
    
        it.only('raw', () => {
            function source() {
                _`<span>${'foo'}</span>`;
            }

            const [{ ancestors }] = getTemplates(source);
            const scope = getScope(ancestors);         
            
            assert.deepEqual(scope, {
                params: new Set(),
                destructured: new Map()
            });
        });

        it('direct arrow function return', () => {
            function source() {
                foo => _`<span>${foo}</span>`;
            }

            const [{ ancestors }] = getTemplates(source);
            const { params } = getScope(ancestors);

            assert.deepEqual(params, new Set(['foo']));
        });

        it('named function return', () => {
            function source() {
                function named(foo) {
                    return _`<span>${foo}</span>`;
                }
            }

            const [{ ancestors }] = getTemplates(source);
            const scope = getScope(ancestors);

            assert.deepEqual(scope, {
                params: new Set(['foo']),
                // -> return -> block -> function
                parent: ancestors[ancestors.length - 3]
            });
        });

        it('higher order function with template arrow', () => {
            function source() {
                function higherOrder(template) {
                    return () => _`<span>#${template}</span>`;
                }
            }

            const [{ ancestors }] = getTemplates(source);
            const scope = getScope(ancestors);

            assert.deepEqual(scope, {
                params: new Set(),
                // -> function
                parent: ancestors[ancestors.length - 1]
            });
        });

    });

    describe('sibling templates with shared scope', () => {

        it('siblings have same scope values', () => {
            function source() {
                const t1 = (foo, condition) => {
                    const view = _`<span>${foo}</span>`;
                    const edit = _`<input value=${foo}>`;
                    return _`${condition ? view : edit}`;
                };
            }

            const test = ({ ancestors }, levels) => {
                const scope = getScope(ancestors);
                assert.deepEqual(scope, {
                    params: new Set(['foo', 'condition']),
                    parent: ancestors[ancestors.length - levels]
                });
            };

            const templates = getTemplates(source);
            assert.equal(templates.length, 3);

            // -> var declarator -> var declaration -> block -> function
            test(templates[0], 4);
            test(templates[1], 4);
            // -> return -> block -> function
            test(templates[2], 3);            
        });
    });

    describe('nested', () => {

        it('raw', () => {
            function source() {
                foo => _`<span>${_`<p>nested</p>`}</span>`;
            }

            const [{ node, ancestors: parentAncestors }] = getTemplates(source);
            const parentScope = getScope(parentAncestors);

            const [{ ancestors }] = getTaggedTemplates(node.quasi);

            const scope = getScope(ancestors, null, parentScope);
            assert.deepEqual(scope, {
                params: new Set(['foo']),
                // same parent
                parent: parentScope.parent
            });
        });

        it('with own params', () => {
            function source() {
                items => _`<span>${items.map(item => _`<p>nested</p>`)}</span>`;
            }

            const [{ node, ancestors: parentAncestors }] = getTemplates(source);
            const parentScope = getScope(parentAncestors);

            const [{ ancestors }] = getTaggedTemplates(node.quasi);
            const scope = getScope(ancestors, null, parentScope);
            assert.deepEqual(scope, {
                params: new Set(['items', 'items']),
                // -> function
                parent: ancestors[ancestors.length - 1]
            });
        });
    });

    describe('destructuring', () => {

        it('arrow function single param', () => {
            function source() {
                ({ foo }) => _`<span>${foo}</span>`;
            }

            const [{ ancestors }] = getTemplates(source);
            const { params, destructured } = getScope(ancestors);
            
            // -> function
            const parent = ancestors[ancestors.length - 1];
            const entries = [...destructured.entries()];
            assert.equal(entries.length, 1);            
            const [[ key, value ]] = entries;

            assert.equal(key, parent);
            assert.deepEqual(value, new Map([[0, ['foo']]]));

            assert.deepEqual(params, new Set(['foo']));
        });
    });
});
