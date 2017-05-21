import AttributeBinder from '../../src/binders/attribute-binder';

import chai from 'chai';
const assert = chai.assert;

describe('AttributeBinder', () => {
    it('writes text-node', () => {
        const binder = new AttributeBinder({ attr: 'my-attribute' });
        assert.equal(binder.name, 'my-attribute');
        assert.equal(binder.write(), '""');
    });
});
