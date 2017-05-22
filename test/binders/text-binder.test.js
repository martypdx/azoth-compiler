import TextChildNodeBinder from '../../src/binders/text-child-node-binder';

import chai from 'chai';
const assert = chai.assert;

describe('TextChildNodeBinder', () => {
    it('writes text-node', () => {
        assert.equal(new TextChildNodeBinder().write(), '<text-node></text-node>');
    });

    it('defaults to index -1', () => {
        assert.equal(new TextChildNodeBinder().index, -1);
    });
});
