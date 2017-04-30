/*eslint no-unused-vars: off */
/* globals _ */
import assert from 'assert';
import getTaggedTemplates from '../src/get-tagged-templates';

describe('get tagged template', () => {
    
    const getTemplate = source => getTaggedTemplates(source.toAst());
    
    const isProgramTTE = ({ ancestors, node }) => {
        assert.ok(ancestors.length);
        assert.equal(ancestors[0].type, 'Program');
        assert.equal(node.type, 'TaggedTemplateExpression');
    };

    const parentType = ({ ancestors }) => ancestors[ancestors.length - 1].type;

    it('raw', () => {
    
        function source() {
            _`<span>${'foo'}</span>`;
        }

        const templates = getTemplate(source);
        assert.equal(templates.length, 1);
        const [ template ] = templates;
        isProgramTTE(template);
        assert.equal(parentType(template), 'ExpressionStatement');
    });

    it('direct return from function', () => {

        function source() {
            foo => _`<span>${foo}</span>`;
        }

        const templates = getTemplate(source);
        assert.equal(templates.length, 1);
        const [ template ] = templates;
        isProgramTTE(template);
        assert.equal(parentType(template), 'ArrowFunctionExpression');
    });

    it('variable declaration', () => {

        function source() {
            const foo = _`<span>${foo}</span>`;
        }

        const templates = getTemplate(source);
        assert.equal(templates.length, 1);
        const [ template ] = templates;
        isProgramTTE(template);
        assert.equal(parentType(template), 'VariableDeclarator');
    });

    it('sibling functions', () => {

        function source() {
            const t1 = foo => _`<span>${foo}</span>`;
            const t2 = bar => _`<span>${bar}</span>`;
        }

        const templates = getTemplate(source);
        assert.equal(templates.length, 2);
        isProgramTTE(templates[0]);
        isProgramTTE(templates[1]);     
    });

    it('ignores nested', () => {
        function source() {
            foo => _`<span>${ _`nested` }</span>`;
        }

        const templates = getTemplate(source);
        assert.equal(templates.length, 1);
        const [ template ] = templates;
        isProgramTTE(template);
        // make sure this is outer template
        assert.equal(template.node.start, 'foo => '.length);
    });
});
