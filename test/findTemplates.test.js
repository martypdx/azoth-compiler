import findTemplates from '../src/findTemplates';
import parse from '../src/ast';
import chai from 'chai';
const assert = chai.assert;

describe('find templates', () => {

    function getTemplates(source, tag = '$') {
        return findTemplates(parse(source), tag);
    }

    describe('find', () => {

        it('tagged templates', () => {
            
            const templates = getTemplates(`
                import { html as $ } from 'diamond';
                const template = (foo, bar) => $\`<span class-foo=\${foo}>hello \${place}</span>\`;
            `);

            assert.equal(templates.length, 1);
            const [{ html, bindings, scope, node }] = templates;
            assert.ok(html);
            assert.ok(scope);
            assert.ok(bindings);
            assert.ok(node);

        });

        it('ignores nested templates', () => {
            
            const templates = getTemplates`
                import { html as $ } from 'diamond';
                const template = items => $\`
                    <ul>
                        \${ items.map(item => $\`
                            <li>\${ item }</li>
                        \`)}
                    </ul>
                \`;
                export default template;
            `;

            assert.equal(templates.length, 1);
        });

        it('sibling templates', () => {
            
            const templates = getTemplates`
                import { html as $ } from 'diamond';
                const template1 = foo => $\`\${foo}\`;
                const template2 = foo => $\`\${foo}\`;
            `;

            assert.equal(templates.length, 2);
        });

    });

    describe('parse', () => {

        it('orphan text value', () => {
            const templates = getTemplates(`
                const template = foo => $\`\*\${foo}\`;
            `);

            const [{ html, bindings, node }] = templates;
            assert.equal(html, '<text-node></text-node>');
            // TTE's are mutated into Identifier
            assert.equal(node.type, 'Identifier');
            
            assert.deepEqual(bindings, [{
                elIndex: 0,
                index: 0,
                observable: true,
                ref: 'foo',
                type: 'text-node'
            }]);
        });

        it('child text value', () => {
            const templates = getTemplates(`
                const template = place => $\`<span>hello *\${place}</span>\`;
            `);

            const { html, bindings, /*scope,*/ node } = templates[0];
            assert.equal(html, '<span data-bind>hello <text-node></text-node></span>');
            assert.equal(node.type, 'Identifier');
            
            assert.deepEqual(bindings, [{
                elIndex: 0,
                index: 1,
                observable: true,
                ref: 'place',
                type: 'text-node'
            }]);
        });

        describe('blocks', () => {

            it('block value', () => {
                
                const templates = getTemplates(`
                    const template = place => $\`<div>#\${$\`<span>*\${place}</span>\`}</div>\`;
                `);

                const [{ html, bindings }] = templates;
                
                assert.equal(html, '<div data-bind><block-node></block-node></div>');
                
                // remove node prop for easier deepEqual test 
                delete bindings[0].templates[0].node;

                assert.deepEqual(bindings, [{
                    elIndex: 0,
                    index: 0,
                    type: 'block',
                    templates: [{
                        html: '<span data-bind><text-node></text-node></span>',
                        bindings: [{
                            elIndex: 0,
                            index: 0,
                            observable: true,
                            ref: 'place',
                            type: 'text-node'
                        }],
                        scope: void 0
                    }]
                }]);
            });

            it.skip('multiple block values in expression', () => {
                
                const templates = getTemplates(`
                    choice => $\`#\${choice ? $\`<span>Yes</span>\` : $\`<span>No</span>\`}\`;
                `);

                const [{ html, bindings }] = templates;
                
                assert.equal(html, '<block-node></block-node>');
                
                // remove node prop for easier deepEqual test 
                delete bindings[0].templates[0].node;

                assert.deepEqual(bindings, [{
                    elIndex: 0,
                    expr: (t0, t1) => `choice ? ${t0} : ${t1}`,
                    index: 0,
                    params: ['choice'],
                    type: 'block',
                    templates: [{
                        html: '<span>Yes</span>',
                        bindings: [],
                        scope: void 0
                    }, {
                        html: '<span>No</span>',
                        bindings: [],
                        scope: void 0
                    }]
                }]);
            });
        });
    });
});