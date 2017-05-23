/*eslint no-unused-vars: off */
/* globals _ */
import parse from '../../src/parse/parse';
import astParse from '../../src/ast';
import chai from 'chai';
const assert = chai.assert;

const parseTemplates = source => parse(source.toAst());


describe.skip('parse', () => {

    function testTemplate(template, i) {
        const { html, bindings, params, node, position } = template;
        
        assert.deepEqual(node, {
            name: `t${i}`,
            type: 'Identifier'
        });

        assert.isNotNull(html);
        assert.isNotNull(bindings);
        assert.isNotNull(params);
        assert.isNotNull(position);       
    }

    it('single template', () => {
    
        function source() {
            const template = (foo, bar) => _`
                <span class-foo=${foo}>hello ${bar}</span>
            `;
        }
        const templates = parseTemplates(source);
        assert.equal(templates.length, 1, 'expected one template');
        templates.forEach(testTemplate);
    });

    it('sibling templates', () => {
        function source() {
            const template1 = foo => _`${foo}`;
            const template2 = foo => _`${foo}`;
        }

        const templates = parseTemplates(source);
        assert.equal(templates.length, 2);
        templates.forEach(testTemplate);
    });
    
    // TODO: nest template in non-block should warn
    
    it('nested template', () => {
        function source() {
            const template = items => _`
                <ul>
                    #${items.map(item => _`
                        <li>${item}</li>
                    `)}
                </ul>
            `;
        }

        const templates = parseTemplates(source);
        assert.equal(templates.length, 1);
        const [{ bindings }] = templates;
        
        const [binding] = bindings;
        const { templates: nested } = binding;
        assert.equal(nested.length, 1);

        const [{ params }] = nested;
        assert.equal(params.length, 1);
        nested.forEach(testTemplate);

    });

    it('nested template with outer scope', () => {
        function source() {
            const template = items => _`
                <ul>
                    #${items.map(item => _`
                        <li>${item} of ${items}</li>
                    `)}
                </ul>
            `;
        }

        const templates = parseTemplates(source);
        const [{ bindings: outerBindings }] = templates;
        const [binding] = outerBindings;
        const { templates: nested } = binding;
        assert.equal(nested.length, 1);
        nested.forEach(testTemplate);
        const [{ params /*, bindings*/ }] = nested;
        assert.equal(params.length, 1);

        // TODO: ensure that identifiers are correctly passed down.
        // parse-template should process correctly, but parse
        // needs to be tested that they are passed from parent correctly
        // check bindings, but prob not deepEqual
        // assert.deepEqual(bindings, []);
    });

});
