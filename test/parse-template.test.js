/*eslint no-unused-vars: off */
/* globals _ */

import findTemplates from '../src/find-templates';
import parse from '../src/ast';
import chai from 'chai';
const assert = chai.assert;

import getParams from '../src/get-params';
import parseTemplate from '../src/parse-template';

const parseSource = source => {
    const { node: { quasi }, ancestors } = findTemplates(source.toAst())[0];
    const { identifiers } = getParams(ancestors);
    return parseTemplate(quasi, new Set(identifiers)); 
};

describe.skip('parse template', () => {

    describe('text-node', () => {
    
        function testSingleText(bindings, options) {
            assert.equal(bindings.length, 1);
            testText(bindings[0], options);
        }    

        function testText(binding, {
            elIndex = 0,
            index = 0,
            observable = true,
            ref = 'expected ref',
            type = 'text-node'
        } = {}) {
            assert.deepEqual(binding, { elIndex, index, observable, ref, type });
        }

        it('stand-alone text node', () => {
            function source() {
                const template = foo => _`*${foo}`;
            }
            const { html, bindings } = parseSource(source);
            assert.equal(html, '<text-node></text-node>');
            testSingleText(bindings, { ref: 'foo' });
        });

        it('element with text node', () => {
            function source() {
                const template = place => _`<span>hello *${place}</span>`;
            }

            const { html, bindings } = parseSource(source);

            assert.equal(html,
                '<span data-bind>hello <text-node></text-node></span>'
            );
            testSingleText(bindings, { index: 1, ref: 'place' });
        });

        it('second element with text node', () => {
            function source() {
                const template = place => _`<span>hello</span> <span>*${place}</span>`;
            }

            const { html, bindings } = parseSource(source);

            assert.equal(html,
                '<span>hello</span> <span data-bind><text-node></text-node></span>'
            );
            testSingleText(bindings, { ref: 'place' });
        });

        it('two elements with text node', () => {
            function source() {
                const template = (salutation, place) => _`<span>*${salutation}</span> <span>*${place}</span>`;
            }

            const { html, bindings } = parseSource(source);

            assert.equal(html,
                '<span data-bind><text-node></text-node></span> <span data-bind><text-node></text-node></span>'
            );
            assert.equal(bindings.length, 2);
            testText(bindings[0], { ref: 'salutation' });
            testText(bindings[1], { elIndex: 1, ref: 'place' });
        });

        it('one elements with two text node', () => {
            function source() {
                const template = (salutation, place) => _`<span>*${salutation} *${place}</span>`;
            }

            const { html, bindings } = parseSource(source);

            assert.equal(html,
                '<span data-bind><text-node></text-node> <text-node></text-node></span>'
            );
            assert.equal(bindings.length, 2);
            testText(bindings[0], { ref: 'salutation' });
            testText(bindings[1], { index: 2, ref: 'place' });
        });

        it('child element with text node', () => {
            function source() {
                const template = foo => _`<div><span>*${foo}</span></div>`;
            }

            const { html, bindings } = parseSource(source);

            assert.equal(html,
                '<div><span data-bind><text-node></text-node></span></div>'
            );
            testSingleText(bindings, { ref: 'foo' });
        });

        it('multiple nested elements with text node', () => {
            function source() {
                const template = (one, two, three) => _`
                    <div>*${one}
                        <span>*${two}</span>
                        <p><span>*${three}</span></p>
                    </div>
                `;
            }

            const { html, bindings } = parseSource(source);
            assert.equal(html, `
                    <div data-bind><text-node></text-node>
                        <span data-bind><text-node></text-node></span>
                        <p><span data-bind><text-node></text-node></span></p>
                    </div>
                `);
            
            assert.equal(bindings.length, 3);
            testText(bindings[0], { ref: 'one' });
            testText(bindings[1], { elIndex: 1, ref: 'two' });
            testText(bindings[2], { elIndex: 2, ref: 'three' });
        });
    });

    describe.skip('blocks', () => {
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
