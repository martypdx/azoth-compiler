import BlockBinder from '../../src/binders/block-binder';

import chai from 'chai';
const assert = chai.assert;

describe('BlockBinder', () => {
    it('writes block-node', () => {
        const binder = new BlockBinder();
        assert.equal(binder.write(), '<block-node></block-node>');
    });
});
