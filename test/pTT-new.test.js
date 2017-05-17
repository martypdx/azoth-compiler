/*eslint no-unused-vars: off */
/* globals $ */

import findTemplates from '../src/find-templates';
import parse from '../src/ast';
import chai from 'chai';
const assert = chai.assert;

const getTemplatesByTag = tag => source => findTemplates(parse(source), tag);
const get$Templates = getTemplatesByTag('$');
const getTemplates = source => get$Templates(source.toCode());

const removeProp = prop => obj => (delete obj[prop], obj);
const removeEnd = removeProp('end');
const removeStart = removeProp('start');
const removePos = obj => removeEnd(removeStart(obj));
const deepEqual = (actual, expected) => {
    assert.ok(actual, 'actual was undefined');
    assert.deepEqual(removePos(actual), expected);
};

describe.skip('parse', () => {
    it('orphan text value', () => {
        function source() {
            const template = foo => $`*${foo}`;
        }
        const templates = getTemplates(source);

        const [{ html, bindings }] = templates;
        assert.equal(html, '<text-node></text-node>');


        assert.deepEqual(bindings, [
            {
                elIndex: 0,
                index: 0,
                observable: true,
                ref: 'foo',
                type: 'text-node'
            }
        ]);
    });

    it('child text value', () => {
        function source() {
            const template = place => $`<span>hello *${place}</span>`;
        }

        const templates = getTemplates(source);

        const { html, bindings, /*scope,*/ node } = templates[0];
        assert.equal(
            html,
            '<span data-bind>hello <text-node></text-node></span>'
        );
        assert.equal(node.type, 'Identifier');

        assert.deepEqual(bindings, [
            {
                elIndex: 0,
                index: 1,
                observable: true,
                ref: 'place',
                type: 'text-node'
            }
        ]);
    });

    describe('blocks', () => {
        it('block value', () => {
            function source() {
                const template = place => $`<div>#${$`<span>*${place}</span>`}</div>`;
            }
            const templates = getTemplates(source);

            const [{ html, bindings }] = templates;

            assert.equal(
                html,
                '<div data-bind><block-node></block-node></div>'
            );

            // remove node prop for easier deepEqual test
            delete bindings[0].templates[0].node;

            assert.deepEqual(bindings, [
                {
                    elIndex: 0,
                    index: 0,
                    type: 'block',
                    templates: [
                        {
                            html: '<span data-bind><text-node></text-node></span>',
                            bindings: [
                                {
                                    elIndex: 0,
                                    index: 0,
                                    observable: true,
                                    ref: 'place',
                                    type: 'text-node'
                                }
                            ],
                            scope: void 0
                        }
                    ]
                }
            ]);
        });

        it.skip('multiple block values in expression', () => {
            const templates = getTemplates(
                `
                    choice => $\`#\${choice ? $\`<span>Yes</span>\` : $\`<span>No</span>\`}\`;
                `
            );

            const [{ html, bindings }] = templates;

            assert.equal(html, '<block-node></block-node>');

            // remove node prop for easier deepEqual test
            delete bindings[0].templates[0].node;

            assert.deepEqual(bindings, [
                {
                    elIndex: 0,
                    expr: (t0, t1) => `choice ? ${t0} : ${t1}`,
                    index: 0,
                    params: ['choice'],
                    type: 'block',
                    templates: [
                        {
                            html: '<span>Yes</span>',
                            bindings: [],
                            scope: void 0
                        },
                        {
                            html: '<span>No</span>',
                            bindings: [],
                            scope: void 0
                        }
                    ]
                }
            ]);
        });
    });
});
