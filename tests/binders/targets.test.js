import { text, block, attribute } from '../../src/binders/targets';

import chai from 'chai';
const assert = chai.assert;

describe('binder targets', () => {

    it('text', () => {
        assert.equal(text.html, '<text-node></text-node>');
        assert.deepEqual(
            text.init({ index: 2 }), 
            { name: '__textBinder', arg: 2 }
        );
    });

    it('block', () => {
        assert.equal(block.html, '<block-node></block-node>');
        assert.deepEqual(
            block.init({ index: 2 }), 
            { name: '__blockBinder', arg: 2 }
        );
    });

    it('attribute', () => {
        assert.equal(attribute.html, '""');
        assert.deepEqual(
            attribute.init({ name: 'name' }), 
            { name: '__attrBinder', arg: 'name' }
        );
    });
});
