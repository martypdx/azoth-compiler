/*eslint no-unused-vars: off */
/* globals _ */
import parse from '../src/ast';

const assert = require('chai').assert;

import getTaggedTemplate from '../src/get-tagged-template';
import getScopeFor from '../src/get-scope';

const TAG = { tag: '_' };
const getTemplate = source => getTaggedTemplate(source.toAst(), TAG);
const getScope = source => getScopeFor(getTemplate(source)[0].ancestors);
    
const removePos = node => (delete node.start, delete node.end, node);
const deepEqual = (actual, expected) => {
    assert.ok(actual, 'actual was undefined');
    assert.deepEqual(removePos(actual), expected);
};

describe.only('get scope for tagged template', () => {

    it('raw', () => {
    
        function source() {
            _`<span>${'foo'}</span>`;
        }

        const scope = getScope(source);
        assert.isNull(scope);
    });
    
    it('direct arrow function return', () => {
    
        function source() {
            foo => _`<span>${foo}</span>`;
        }

        const scope = getScope(source);

        deepEqual(scope, {
            params: ['foo'],
            plucks: []
        });
    });

    it('named function return', () => {
    
        function source() {
            function named(foo) {
                return _`<span>${foo}</span>`;
            }
        }

        const scope = getScope(source);

        deepEqual(scope, {
            params: ['foo'],
            plucks: []
        });
    });

    it('higher order function with template arrow', () => {
    
        function source() {
            function higherOrder(template) {
                return () => _`<span>#${template}</span>`;
            }
        }

        const scope = getScope(source);

        deepEqual(scope, {
            params: [],
            plucks: []
        });
    });

});
