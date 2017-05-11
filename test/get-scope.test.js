/* eslint no-unused-vars: off */
/* globals _ */
import { assert } from 'chai';
import getTaggedTemplates from '../src/get-tagged-templates';
import getScope, { getIdentifiers } from '../src/get-scope';

const getTemplates = source => getTaggedTemplates(source.toAst());

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

        const getScopeFor = source => {
            const [{ ancestors }] = getTemplates(source);
            return getScope(ancestors);
        };
                
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

        it('multiple params', () => {
            function source() {
                (foo, bar) => _`<span>${foo + bar}</span>`;
            }

            const { params, identifiers } = getScopeFor(source);
            assert.deepEqual([...identifiers], ['foo', 'bar']);
            assert.equal(params.length, 2);
        });
    });

    describe('sibling templates with shared scope', () => {
        it('same identifer', () => {
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

    describe('nested', () => {
        it('raw', () => {
            function source() {
                foo => _`<span>${_`<p>nested</p>`}</span>`;
            }

            const [{ node, ancestors: parentAncestors }] = getTemplates(source);
            const parentScope = getScope(parentAncestors);
            
            const [{ ancestors }] = getTaggedTemplates(node.quasi);

            const { params, identifiers } = getScope(ancestors, parentScope);
            assert.deepEqual([...identifiers], ['foo']);
            assert.equal(params.length, 0);
        });

        it('with own params', () => {
            function source() {
                items => _`<span>${items.map(item => _`<p>nested</p>`)}</span>`;
            }

            const [{ node, ancestors: parentAncestors }] = getTemplates(source);
            const parentScope = getScope(parentAncestors);

            const [{ ancestors }] = getTaggedTemplates(node.quasi);

            const { params, identifiers } = getScope(ancestors, parentScope);
            assert.deepEqual([...identifiers], ['items', 'item']);
            assert.equal(params.length, 1);
        });


        it('siblings have own params, shared parent', () => {
            function source() {
                const template = (items, condition) => {
                    const one = _`<span>${items.map(one => _`<p>${one}</p>`)}</span>`;
                    const two = _`<span>${items.map(two => _`<p>${two}</p>`)}</span>`;
                    return _`${condition ? one : two}`;
                };
            }

            const templates = getTemplates(source);
            assert.equal(templates.length, 3);

            const test = ({ node, ancestors: parentAncestors }, child) => {
                const parentScope = getScope(parentAncestors);
                const { params, identifiers } = parentScope;
                assert.deepEqual([...identifiers], ['items', 'condition']);
                assert.equal(params.length, 2);

                if (child) {
                    const [{ ancestors }] = getTaggedTemplates(node.quasi);
                    const { params, identifiers } = getScope(ancestors, parentScope);
                    assert.deepEqual([...identifiers], ['items', 'condition', child]);
                    assert.equal(params.length, 1);
                }                
            };

            test(templates[0], 'one');
            test(templates[1], 'two');
            test(templates[2]);
        });
    });
});
