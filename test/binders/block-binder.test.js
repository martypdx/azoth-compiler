import BlockBinder from '../../src/binders/block-binder';

import chai from 'chai';
const assert = chai.assert;

describe('BlockBinder', () => {
    it('writes block-node', () => {
        assert.equal(new BlockBinder().write(), '<block-node></block-node>');
    });

    it('defaults to index -1', () => {
        assert.equal(new BlockBinder().index, -1);
    });
});
