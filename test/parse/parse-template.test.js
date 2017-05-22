/*eslint no-unused-vars: off */
/* globals _ */

import findTemplates from '../../src/parse/find-templates';
import parse from '../../src/ast';
import chai from 'chai';
const assert = chai.assert;

import getParams from '../../src/parse/get-params';
import parseTemplate from '../../src/parse/parse-template';

const parseSource = source => {
    const { node: { quasi }, ancestors } = findTemplates(source.toAst())[0];
    const { identifiers } = getParams(ancestors);
    return parseTemplate(quasi, new Set(identifiers)); 
};

describe('parse template', () => {

    describe('text-node', () => {
    
        function testSingleText(bindings, options) {
            assert.equal(bindings.length, 1);
            testText(bindings[0], options);
        }    

        function testText(binding, {
            elIndex = 0,
            index = 0,
            type = 'subscriber',
            ref = '',
            params = null,
            templates = null
        } = {}) {
            const { name, type: astType } = binding.ast;
            assert.equal(astType, 'Identifier');
            assert.equal(name, ref);
            delete binding.ast;
            assert.deepEqual(binding, { elIndex, index, type, params, templates }, `ref: ${ref}`);
        }

        it('stand-alone text node', () => {
            function source() {
                const template = foo => _`*${foo}`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<text-node></text-node>');
            testSingleText(binders, { ref: 'foo' });
        });

        it('element with text node', () => {
            function source() {
                const template = place => _`<span>hello *${place}</span>`;
            }

            const { html, binders } = parseSource(source);

            assert.equal(html,
                '<span data-bind>hello <text-node></text-node></span>'
            );
            testSingleText(binders, { index: 1, ref: 'place' });
        });

        it('second element with text node', () => {
            function source() {
                const template = place => _`<span>hello</span> <span>*${place}</span>`;
            }

            const { html, binders } = parseSource(source);

            assert.equal(html,
                '<span>hello</span> <span data-bind><text-node></text-node></span>'
            );
            testSingleText(binders, { ref: 'place' });
        });

        it('two elements with text node', () => {
            function source() {
                const template = (salutation, place) => _`<span>*${salutation}</span> <span>*${place}</span>`;
            }

            const { html, binders } = parseSource(source);

            assert.equal(html,
                '<span data-bind><text-node></text-node></span> <span data-bind><text-node></text-node></span>'
            );
            assert.equal(binders.length, 2);
            testText(binders[0], { ref: 'salutation' });
            testText(binders[1], { elIndex: 1, ref: 'place' });
        });

        it('one elements with two text node', () => {
            function source() {
                const template = (salutation, place) => _`<span>*${salutation} *${place}</span>`;
            }

            const { html, binders } = parseSource(source);

            assert.equal(html,
                '<span data-bind><text-node></text-node> <text-node></text-node></span>'
            );
            assert.equal(binders.length, 2);
            testText(binders[0], { ref: 'salutation' });
            testText(binders[1], { index: 2, ref: 'place' });
        });

        it('child element with text node', () => {
            function source() {
                const template = foo => _`<div><span>*${foo}</span></div>`;
            }

            const { html, binders } = parseSource(source);

            assert.equal(html,
                '<div><span data-bind><text-node></text-node></span></div>'
            );
            testSingleText(binders, { ref: 'foo' });
        });

        it('multiple nested elements with text node', () => {
            function source() {
                const template = (one, two, three, four, five) => _`
                    <div>*${one}
                        <span>*${three}</span>
                        <p><span>*${five}</span>*${four}</p>
                        *${two}
                    </div>
                `;
            }

            const { html, binders } = parseSource(source);
            assert.equal(html, `
                    <div data-bind><text-node></text-node>
                        <span data-bind><text-node></text-node></span>
                        <p data-bind><span data-bind><text-node></text-node></span><text-node></text-node></p>
                        <text-node></text-node>
                    </div>
                `);
            
            assert.equal(binders.length, 5);
            testText(binders[0], { elIndex: 0, ref: 'one' });
            testText(binders[1], { elIndex: 0, index: 6, ref: 'two' });
            testText(binders[2], { elIndex: 1, ref: 'three' });
            testText(binders[3], { elIndex: 2, index: 1, ref: 'four' });
            testText(binders[4], { elIndex: 3, ref: 'five' });
        });
    });

    describe.skip('blocks', () => {
        it('block value', () => {
            function source() {
                const template = place => $`<div>#${$`<span>*${place}</span>`}</div>`;
            }
            const templates = getTemplates(source);

            const [{ html, binders }] = templates;

            assert.equal(
                html,
                '<div data-bind><block-node></block-node></div>'
            );

            // remove node prop for easier deepEqual test
            delete binders[0].templates[0].node;

            assert.deepEqual(binders, [
                {
                    elIndex: 0,
                    index: 0,
                    type: 'block',
                    templates: [
                        {
                            html: '<span data-bind><text-node></text-node></span>',
                            binders: [
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

            const [{ html, binders }] = templates;

            assert.equal(html, '<block-node></block-node>');

            // remove node prop for easier deepEqual test
            delete binders[0].templates[0].node;

            assert.deepEqual(binders, [
                {
                    elIndex: 0,
                    expr: (t0, t1) => `choice ? ${t0} : ${t1}`,
                    index: 0,
                    params: ['choice'],
                    type: 'block',
                    templates: [
                        {
                            html: '<span>Yes</span>',
                            binders: [],
                            scope: void 0
                        },
                        {
                            html: '<span>No</span>',
                            binders: [],
                            scope: void 0
                        }
                    ]
                }
            ]);
        });
    });
});
