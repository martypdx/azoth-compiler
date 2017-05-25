/*eslint no-undef: off */
import Binder from '../../src/binders/binder';
import chai from 'chai';
const assert = chai.assert;

describe('Binder', () => {
    
    it('elIndex defaults to -1', () => {
        assert.equal(new Binder().elIndex, -1);
    });

});
