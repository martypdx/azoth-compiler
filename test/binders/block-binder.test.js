import BlockChildNodeBinder from '../../src/binders/block-child-node-binder';

import chai from 'chai';
const assert = chai.assert;

describe('BlockBinder', () => {
    it('writes block-node', () => {
        assert.equal(new BlockChildNodeBinder().write(), '<block-node></block-node>');
    });

    it('defaults to index -1', () => {
        assert.equal(new BlockChildNodeBinder().index, -1);
    });
});
