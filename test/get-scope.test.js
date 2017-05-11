/* eslint no-unused-vars: off */
/* globals _ */
import { assert } from 'chai';
import getTaggedTemplates from '../src/get-tagged-templates';
import getScope, { getIdentifiers } from '../src/get-scope';

const getTemplates = source => getTaggedTemplates(source.toAst());
const getScopeFor = source => {
    const [{ ancestors }] = getTemplates(source);
    return getScope(ancestors);
};

describe.only('get scope for tagged template', () => {

    describe('get identifiers', () => {

        it('single param', () => {
            const identifiers = getIdentifiers([{
                type: 'Identifier',
                name: 'single'
            }]);
            assert.deepEqual(identifiers, ['single']);
        });

        it('two params', () => {
            const identifiers = getIdentifiers([{
                type: 'Identifier',
                name: 'one'
            },
            {
                type: 'Identifier',
                name: 'two'
            }]);
            assert.deepEqual(identifiers, ['one', 'two']);
        });

        it('object pattern', () => {
            const identifiers = getIdentifiers([{
                type: 'ObjectPattern',
                properties: [{
                    type: 'Property',
                    value: {
                        type: 'Identifier',
                        name: 'prop'
                    }
                }, {
                    type: 'Property',
                    value: {
                        type: 'Identifier',
                        name: 'alias'
                    }
                }]
            }]);
            assert.deepEqual(identifiers, ['prop', 'alias']);
        });

        it('nested object pattern', () => {
            const identifiers = getIdentifiers([{
                type: 'ObjectPattern',
                properties: [{
                    type: 'Property',
                    value: {
                        type: 'ObjectPattern',
                        properties: [{
                            type: 'Property',
                            value: {
                                type: 'Identifier',
                                name: 'nested'
                            }        
                        }]
                    }
                }]
            }]);
            assert.deepEqual(identifiers, ['nested']);
        });
    });

    describe('simple top-level', () => {
        it('raw', () => {
            function source() {
                _`<span>${'foo'}</span>`;
            }
            const { params, identifiers } = getScopeFor(source);
            assert.deepEqual([...identifiers], []);
            assert.equal(params.length, 0);
        });

        it('direct arrow function return', () => {
            function source() {
                foo => _`<span>${foo}</span>`;
            }
            const { params, identifiers } = getScopeFor(source);
            assert.deepEqual([...identifiers], ['foo']);
            assert.equal(params.length, 1);
        });

        it('named function return', () => {
            function source() {
                function named(foo) {
                    return _`<span>${foo}</span>`;
                }
            }
            const { params, identifiers } = getScopeFor(source);
            assert.deepEqual([...identifiers], ['foo']);
            assert.equal(params.length, 1);
        });

        it('higher order function with template arrow', () => {
            function source() {
                function higherOrder(template) {
                    return () => _`<span>#${template}</span>`;
                }
            }
            const { params, identifiers } = getScopeFor(source);
            assert.deepEqual([...identifiers], []);
            assert.equal(params.length, 0);
        });
    });

    describe('multiple top-level params', () => {
        it('arrow function', () => {
            function source() {
                (foo, bar) => _`<span>${foo + bar}</span>`;
            }

            const { params, identifiers } = getScopeFor(source);
            assert.deepEqual([...identifiers], ['foo', 'bar']);
            assert.equal(params.length, 2);
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

            const test = ({ ancestors }) => {
                const { params, identifiers } = getScope(ancestors);
                assert.deepEqual([...identifiers], ['foo', 'condition']);
                assert.equal(params.length, 2);
            };
            
            const templates = getTemplates(source);
            assert.equal(templates.length, 3);

            test(templates[0]);
            test(templates[1]);
            test(templates[2]);
        });
    });

    describe.skip('nested', () => {
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

    describe.skip('destructuring', () => {
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
            const [[key, value]] = entries;

            assert.equal(key, parent);
            assert.deepEqual(value, new Map([[0, ['foo']]]));

            assert.deepEqual(params, new Set(['foo']));
        });
    });
});
