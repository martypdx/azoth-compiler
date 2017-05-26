import getBinder, { ChildBinder, AttributeBinder } from '../../src/binders/binder-factory';
import { text, block, attribute } from '../../src/binders/writers';

import chai from 'chai';
const assert = chai.assert;

describe('binder factory', () => {

    describe('binding type', () => {
        it('passes thru', () => {
            const binder = getBinder({ inAttributes: false, block: false, type: 'value' });
            assert.equal(binder.type, 'value');
        });
    });

    describe('element child', () => {
        it('text binder', () => {
            const binder = getBinder({ inAttributes: false, block: false });
            assert.instanceOf(binder, ChildBinder);
            assert.equal(binder.writer, text);
        });

        it('block binder', () => {
            const binder = getBinder({ inAttributes: false, block: true });
            assert.instanceOf(binder, ChildBinder);
            assert.equal(binder.writer, block);
        });
    });  

    describe('element attribute', () => {
        it('attribute binder', () => {
            const binder = getBinder({ inAttributes: true, block: false });
            assert.instanceOf(binder, AttributeBinder);
            assert.equal(binder.writer, attribute);
        });

        it('attribute block binder not yet supported', () => {
            assert.throws(() => getBinder({ inAttributes: true, block: true }), /not yet supported/);
        });
    });

});