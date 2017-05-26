import AttributeBinder from '../../src/binders/attribute-binder';

import chai from 'chai';
const assert = chai.assert;

describe('AttributeBinder', () => {
    
    let binder = null;
    beforeEach(() => binder = new AttributeBinder());

    it('writeHtml empty attribute value', () => {
        assert.equal(binder.writeHtml(), '""');
    });

    it('name', () => {
        assert.equal(binder.name, '');
        binder.init(null, 'attribute-name');
        assert.equal(binder.name, 'attribute-name');
    });

    it('has named import', () => {
        assert.deepEqual(binder.writeImport(), { named: '__attrBinder' });
    });

    it('init to textBinder with childNode index', () => {
        binder.init(null, 'class');
        assert.equal(binder.writeInit(), `__attrBinder('class')`);
    });
  
});
