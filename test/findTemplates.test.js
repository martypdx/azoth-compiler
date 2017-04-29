/*eslint no-unused-vars: off */
/* globals $ */

import findTemplates from '../src/findTemplates';
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

describe('find templates', () => {

    it('single template', () => {
    
        function source() {
            const template = (foo, bar) => $`
                <span class-foo=${foo}>hello ${bar}</span>
            `;
        }

        const templates = getTemplates(source);

        assert.equal(templates.length, 1);

        const [{ scope, node }] = templates;

        deepEqual(node, {
            name: 't0',
            type: 'Identifier'
        });

        deepEqual(scope, {
            params: { foo: true, bar: true },
            plucks: []
        });
    });

    it('sibling templates', () => {
        function source() {
            const template1 = foo => $`${foo}`;
            const template2 = foo => $`${foo}`;
        }

        const templates = getTemplates(source);

        assert.equal(templates.length, 2);

        let [{ scope, node }] = templates;
        deepEqual(node, {
            name: 't0',
            type: 'Identifier'
        });
        deepEqual(scope, {
            params: { foo: true },
            plucks: []
        });

        [, { scope, node }] = templates;
        deepEqual(node, {
            name: 't1',
            type: 'Identifier'
        });
        deepEqual(scope, {
            params: { foo: true },
            plucks: []
        });
    });
    
    // TODO: nest template in non-block should warn
    
    it('nested template', () => {
        function source() {
            const template = items => $`
                <ul>
                    #${items.map(item => $`
                        <li>${item}</li>
                    `)}
                </ul>
            `;
        }

        const templates = getTemplates(source);
        assert.equal(templates.length, 1);
        const [{ bindings }] = templates;
        
        const [binding] = bindings;
        const { templates: nested, params } = binding;

        assert.equal(nested.length, 1);

        const [{ scope, node }] = nested;

        deepEqual(node, {
            name: 't0', type: 'Identifier'
        });

        deepEqual(scope, {
            params: { item: true, items: true },
            plucks: []
        });

    });

    it('nested template with outer scope', () => {
        function source() {
            const template = items => $`
                <ul>
                    #${items.map(item => $`
                        <li>${item} of ${items}</li>
                    `)}
                </ul>
            `;
        }

        const templates = getTemplates(source);
        const [{ bindings }] = templates;
        const nested = bindings[0].templates;
        assert.equal(nested.length, 1);

        const [{ scope, node }] = nested;

        deepEqual(node, {
            name: 't0', type: 'Identifier'
        });

        deepEqual(scope, {
            params: { item: true, items: true },
            plucks: []
        });

    });

});
