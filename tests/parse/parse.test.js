/*eslint no-unused-vars: off */
/* globals _ */
import parse from '../../src/parse/parse';
import astParse from '../../src/ast';
import chai from 'chai';
const assert = chai.assert;

const parseTemplates = source => parse(source.toAst());


describe('parse', () => {

    function testTemplate({ html, bindings, node }) {
        assert.isNotNull(html);
        assert.isNotNull(bindings);
        assert.isNotNull(node);       
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
        assert.equal(templates.length, 2);
        templates.forEach(testTemplate);

    });

    it.skip('nested template with outer scope', () => {
        function source() {
            const template = items => _`
                <ul>
                    #${items.length || _`<span>No items</span>`}
                    #${items.map(item => _`
                        <li>${item + 'of' + items}</li>
                    `)}
                </ul>
            `;
        }

        const templates = parseTemplates(source);
        const [{ binders: outerBinders }] = templates;

        const [ firstOuter, secondOuter ] = outerBinders;
        
        {
            const { templates: nested } = firstOuter;
            assert.equal(nested.length, 1);

            nested.forEach((t, i) => testTemplate(t, i, 0));
            const [{ params, binders }] = nested;
            assert.equal(params.length, 0);
            assert.equal(binders.length, 0);
        }

        {
            const { templates: nested } = secondOuter;
            assert.equal(nested.length, 1);

            nested.forEach((t, i) => testTemplate(t, i, 1));
            const [{ params, binders }] = nested;
            assert.equal(params.length, 1);
            assert.equal(binders.length, 1);

            const [binder] = binders;
            // TODO: skipping because how params handled is changing
            //assert.deepEqual(binder.params, ['item', 'items']);
        }
    });

});
