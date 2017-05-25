import AttributeBinder from '../../src/binders/attribute-binder';

import chai from 'chai';
const assert = chai.assert;

describe('AttributeBinder', () => {

    it('had name and writes empty attr ""', () => {
        const binder = new AttributeBinder({ attr: 'my-attribute' });
        assert.equal(binder.name, '');
        assert.equal(binder.writeHtml(), '""');
        binder.bind({}, 'attribute-name');
        assert.equal(binder.name, 'attribute-name');
    });

});
