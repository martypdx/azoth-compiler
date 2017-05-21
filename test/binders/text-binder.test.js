import TextBinder from '../../src/binders/text-binder';

import chai from 'chai';
const assert = chai.assert;

describe('TextBinder', () => {
    it('writes text-node', () => {
        assert.equal(new TextBinder().write(), '<text-node></text-node>');
    });

    it('defaults to index -1', () => {
        assert.equal(new TextBinder().index, -1);
    });
});
