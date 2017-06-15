import { text, block, attribute } from '../../src/binders/targets';

import chai from 'chai';
const assert = chai.assert;

describe('binder targets', () => {

    it('text', () => {
        assert.equal(text.html, '<text-node></text-node>');
        assert.equal(text.import, '__textBinder');
        assert.equal(text.init({ index: 2 }), '__textBinder(2)');
    });

    it('block', () => {
        assert.equal(block.html, '<block-node></block-node>');
        assert.equal(block.import, '__blockBinder');
        assert.equal(block.init({ index: 2 }), '__blockBinder(2)');
    });

    it('attribute', () => {
        assert.equal(attribute.html, '""');
        assert.equal(attribute.import, '__attrBinder');
        assert.equal(attribute.init({ name: 'name' }), `__attrBinder('name')`);
    });
});
