/*eslint no-unused-vars: off */
import { NO_SIGIL, MAP_SIGIL, SUBSCRIBE_SIGIL, ELEMENT_SIGIL } from '../../src/parse/sigil-types';
import template from '../../src/parse/template';
import chai from 'chai';
const assert = chai.assert;
import { recursive } from 'acorn/dist/walk.es';

const TAG = '_';

function findTemplates(ast) {
    const state = { template: null };
    
    recursive(ast, state, {
        TaggedTemplateExpression(node, st) {
            if (node.tag.name !== TAG) return;
            st.template = node;
        },

    });

    return state.template;
}

const parseSource = source => {
    const { quasi } = findTemplates(source.toAst());
    return template(quasi);
};

/* globals _, Block, Widget, Stream, foo */
describe('parse template', () => {

    function testBinder(binder, {
        elIndex = -1,
        moduleIndex = -1,
        name = '',
        index = -1,
        sigil = NO_SIGIL,
        ref = '',
        observables = [],
        childTemplate = null,
        expectedType = 'Identifier'    
    } = {}) {
        assert.ok(binder, 'binder does not exist');
        const { name: astName, type: astType } = binder.ast;
        assert.equal(astType, expectedType);
        assert.equal(astName || '', ref);
        delete binder.ast;
        delete binder.target;
        delete binder.properties;
        
        assert.deepEqual(
            binder, 
            { elIndex, moduleIndex, index, name, sigil, observables, childTemplate }, 
            `name: ${name || ref}`
        );
    }

    function testAttr(binder, options) { 
        return testBinder(binder, options);
    }

    function testProp(binder, options) { 
        options.elIndex = binder.elIndex;
        options.index = binder.index;
        return testBinder(binder, options);
    }

    function testText(binder, options) {
        options.index = options.index || 0;
        options.sigil = options.sigil || MAP_SIGIL;
        testBinder(binder, options);

    }

    function testFirstText(binders, options) {
        assert.equal(binders.length, 1);
        testText(binders[0], options);
    } 

    describe('text-node', () => {
    

        it('stand-alone text node', () => {
            function source() {
                const template = foo => _`*${foo}`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<text-node></text-node>');
            testFirstText(binders, { ref: 'foo' });
        });

        it('value text node', () => {
            function source() {
                const template = foo => _`${foo}`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<text-node></text-node>');
            testFirstText(binders, { ref: 'foo', sigil: NO_SIGIL });
        });

        it('block text node', () => {
            function source() {
                const template = foo => _`${foo}#`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<!-- block -->');
            testFirstText(binders, { ref: 'foo', sigil: NO_SIGIL });
        });

        it('block observer text node', () => {
            function source() {
                const template = foo => _`*${foo}#`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<!-- block -->');
            testFirstText(binders, { ref: 'foo' });
        });

        it('element with text node', () => {
            function source() {
                const template = place => _`<span>hello *${place}</span>`;
            }

            const { html, binders } = parseSource(source);

            assert.equal(html,
                '<span data-bind>hello <text-node></text-node></span>'
            );
            testFirstText(binders, { index: 1, elIndex: 0, ref: 'place' });
        });

        it('second element with text node', () => {
            function source() {
                const template = place => _`<span>hello</span> <span>*${place}</span>`;
            }

            const { html, binders } = parseSource(source);

            assert.equal(html,
                '<span>hello</span> <span data-bind><text-node></text-node></span>'
            );
            testFirstText(binders, { ref: 'place', elIndex: 0 });
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
            testText(binders[0], { ref: 'salutation', elIndex: 0 });
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
            testText(binders[0], { ref: 'salutation', elIndex: 0 });
            testText(binders[1], { index: 2, ref: 'place', elIndex: 0 });
        });

        it('child element with text node', () => {
            function source() {
                const template = foo => _`<div><span>*${foo}</span></div>`;
            }

            const { html, binders } = parseSource(source);

            assert.equal(html,
                '<div><span data-bind><text-node></text-node></span></div>'
            );
            testFirstText(binders, { ref: 'foo', elIndex: 0 });
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

    describe('components', () => {
  
        it('block component', () => {
            function source() {
                const template = () => _`<#:${Block}></#:>`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<!-- component start --><!-- component end -->');
            testFirstText(binders, { ref: 'Block', sigil: ELEMENT_SIGIL });
        });

        it('self-closing block component', () => {
            function source() {
                const template = () => _`<#:${Block}/>`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<!-- component start --><!-- component end -->');
            testFirstText(binders, { ref: 'Block', sigil: ELEMENT_SIGIL });
        });

        it('self-closing block component with siblings', () => {
            function source() {
                const template = () => _`<input><#:${Block}/><input>`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<input><!-- component start --><!-- component end --><input>');
            testFirstText(binders, { ref: 'Block', sigil: ELEMENT_SIGIL, index: 1 });
        });

        it('block component with properties', () => {
            function source() {
                const template = () => _`<#:${Block} foo=*${foo} bar="BAR"/>`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<!-- component start --><!-- component end -->');
            
            const properties = binders[0].properties;
            testFirstText(binders, { ref: 'Block', sigil: ELEMENT_SIGIL });
            assert.equal(properties.length, 2);
            testProp(properties[0], { name: 'foo', ref: 'foo', sigil: MAP_SIGIL });
            testProp(properties[1], { name: 'bar', expectedType: 'Literal' });

        });

        it('block component with content', () => {
            function source() {
                const template = foo => _`<#:${Widget}><span>${foo}</span></#:>`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<!-- component start --><!-- component end -->');
            const properties = binders[0].properties;
            testFirstText(binders, { ref: 'Widget', sigil: ELEMENT_SIGIL });
            assert.equal(properties.length, 1);
            const [ { childTemplate } ]  = properties;

            assert.equal(childTemplate.html, '<span data-bind><text-node></text-node></span>');
            testFirstText(childTemplate.binders, { ref: 'foo', elIndex: 0, sigil: NO_SIGIL });
        });

        it('wrapped block component with content', () => {
            function source() {
                const template = foo => _`<div><#:${Widget}><span>${foo}</span></#:></div>`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<div data-bind><!-- component start --><!-- component end --></div>');
            const properties = binders[0].properties;
            testFirstText(binders, { ref: 'Widget', elIndex: 0, sigil: ELEMENT_SIGIL });
            assert.equal(properties.length, 1);
            const [ { childTemplate } ]  = properties;

            assert.equal(childTemplate.html, '<span data-bind><text-node></text-node></span>');
            testFirstText(childTemplate.binders, { ref: 'foo', elIndex: 0, sigil: NO_SIGIL });
        });

        it('block component with interpolator content', () => {
            function source() {
                const template = foo => _`<#:${Block}>${foo}</#:>`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<!-- component start --><!-- component end -->');
            
            const properties = binders[0].properties;
            testFirstText(binders, { expectedType: undefined, ref: 'Block', sigil: ELEMENT_SIGIL });
        });

    });

    describe('attribute', () => {

        function testFirstAttr(binders, options) {
            assert.equal(binders.length, 1);
            testAttr(binders[0], options);
        }   
        
        it('simple', () => {
            function source() {
                const template = foo => _`<span bar=${foo}></span>`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<span bar="" data-bind></span>');
            testFirstAttr(binders, { name: 'bar', elIndex: 0, ref: 'foo' });
        });

        it('with statics, value and valueless', () => {
            function source() {
                const template = foo => _`<input class=${foo} type="checkbox" checked>`;
            }
            const { html, binders } = parseSource(source);
            // NOTE: empty string is equivalent to boolean attribute per spec.
            assert.equal(html, '<input class="" type="checkbox" checked="" data-bind>');
            testFirstAttr(binders, { name: 'class', elIndex: 0, ref: 'foo' });
        });

        it('many', () => {
            function source() {
                const template = (one, two, three, four, five) => _`
                    <div one=${one}>
                        <span two=${two}>${three}</span>
                        <p><span four=${four}>text</span></p>
                    </div>
                `;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, `
                    <div one="" data-bind>
                        <span two="" data-bind><text-node></text-node></span>
                        <p><span four="" data-bind>text</span></p>
                    </div>
                `);
            
            assert.equal(binders.length, 4);
            testAttr(binders[0], { elIndex: 0, name: 'one', ref: 'one' });
            testAttr(binders[1], { elIndex: 1, name: 'two', ref: 'two' });
            testAttr(binders[3], { elIndex: 2, name: 'four', ref: 'four' });
        });

        it('binding types', () => {
            function source() {
                const template = (one, two, three) => _`<span one=${one} two=*${two} three=^${three}></span>`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<span one="" two="" three="" data-bind></span>');
            assert.equal(binders.length, 3);
            testAttr(binders[0], { sigil: NO_SIGIL, elIndex: 0, name: 'one', ref: 'one' });
            testAttr(binders[1], { sigil: MAP_SIGIL, elIndex: 0, name: 'two', ref: 'two' });
            testAttr(binders[2], { sigil: SUBSCRIBE_SIGIL, elIndex: 0, name: 'three', ref: 'three' });
        });
    });

    describe('html', () => {
        it('leaves void elements intact', () => {
            function source() {
                const template = foo => _`<input>`;
            }
            const { html, binders } = parseSource(source);
            assert.equal(html, '<input>');
        });
    });
});
