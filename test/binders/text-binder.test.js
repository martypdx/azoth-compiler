import TextBinder from '../../src/binders/text-binder';

import chai from 'chai';
const assert = chai.assert;

describe('TextBinder', () => {
    it('writes text-node', () => {
        const binder = new TextBinder();
        assert.equal(binder.write(), '<text-node></text-node>');
    });
});
