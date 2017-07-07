/*eslint no-undef: off */
import Binder from '../../src/binders/binder';

import chai from 'chai';
const assert = chai.assert;

describe('Binder', () => {

    it('elIndex and moduleIndex default to -1', () => {
        assert.equal(new Binder().elIndex, -1);
        assert.equal(new Binder().moduleIndex, -1);
    });

    describe('target', () => {

        it('index binder.init', () => {
            const childBinder = new Binder({});
            childBinder.init({ childIndex: 2 });
            assert.equal(childBinder.index, 2);
        });

        it('name binder.init', () => {
            const attrBinder = new Binder({});
            attrBinder.init({}, 'name');
            assert.equal(attrBinder.name, 'name');
        });

        it('declaration', () => {
            const writer = {
                init: binder => binder.foo
            };
            const binder = new Binder({}, writer);
            binder.foo = 'FOO';
            assert.equal(binder.declaration, 'FOO');
        });
    });
    
    describe.skip('binding', () => {

        // TODO: test binding.type
        
    });
});
