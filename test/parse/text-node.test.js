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

describe('text-node', () => {

    function testBindings(bindings, expected) {
        expected = Array.isArray(expected) ? expected : [expected];
        assert.equal(bindings.length, expected.length);
        bindings.forEach((binding, i) => testTextNode(binding, expected[i]));
    }

    function testTextNode(
        binding,
        {
            elIndex = 0,
            index = 0,
            ref = 'expected ref',
            type = 'text-node'
        } = {}
    ) {
        assert.deepEqual(binding, { elIndex, index, ref, type });
    }

    it('stand-alone', () => {
        function source() {
            const template = foo => _`${foo}`;
        }
        const { html, bindings } = parseSource(source);
        assert.equal(html, '<text-node></text-node>');
        testBindings(bindings, { ref: 'foo' });
    });

    it('one element', () => {
        function source() {
            const template = place => _`<span>hello ${place}</span>`;
        }

        const { html, bindings } = parseSource(source);

        assert.equal(html,
            '<span data-bind>hello <text-node></text-node></span>'
        );
        testBindings(bindings, { index: 1, ref: 'place' });
    });

    it('second element', () => {
        function source() {
            const template = place =>
                _`<span>hello</span> <span>${place}</span>`;
        }

        const { html, bindings } = parseSource(source);

        assert.equal(html,
            '<span>hello</span> <span data-bind><text-node></text-node></span>'
        );
        testBindings(bindings, { ref: 'place' });
    });

    it('two elements', () => {
        function source() {
            const template = (salutation, place) =>
                _`<span>${salutation}</span> <span>${place}</span>`;
        }

        const { html, bindings } = parseSource(source);

        assert.equal(html,
            '<span data-bind><text-node></text-node></span> <span data-bind><text-node></text-node></span>'
        );
        testBindings(bindings, [
            { ref: 'salutation' },
            { elIndex: 1, ref: 'place' }
        ]);
    });

    it('one elements with two text nodes', () => {
        function source() {
            const template = (salutation, place) =>
                _`<span>${salutation} ${place}</span>`;
        }

        const { html, bindings } = parseSource(source);

        assert.equal(html,
            '<span data-bind><text-node></text-node> <text-node></text-node></span>'
        );
        testBindings(bindings, [
            { ref: 'salutation' },
            { index: 2, ref: 'place' }
        ]);
    });

    it('child element', () => {
        function source() {
            const template = foo => _`<div><span>${foo}</span></div>`;
        }

        const { html, bindings } = parseSource(source);

        assert.equal(html,
            '<div><span data-bind><text-node></text-node></span></div>'
        );
        testBindings(bindings, { ref: 'foo' });
    });

    it('multiple nested elements', () => {
        function source() {
            const template = (one, two, three) => _`
                    <div>${one}
                        <p><span>${two}</span></p>
                        <span>${three}</span>
                    </div>
                `;
        }

        const { html, bindings } = parseSource(source);

        assert.equal(html,
            `
                    <div data-bind><text-node></text-node>
                        <p><span data-bind><text-node></text-node></span></p>
                        <span data-bind><text-node></text-node></span>
                    </div>
                `
        );
        testBindings(bindings, [
            { ref: 'one' },
            { elIndex: 1, ref: 'two' },
            { elIndex: 2, ref: 'three' }
        ]);
    });
});
