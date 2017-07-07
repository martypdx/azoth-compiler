import getBinder from '../../src/binders/binder-factory';
import { text, block, attribute } from '../../src/binders/targets';
import { assert } from 'chai';

describe('binder factory', () => {

    describe('binding type', () => {
        it('passes thru options', () => {
            const binder = getBinder({ inAttributes: false, block: false, sigil: 'value' });
            assert.equal(binder.sigil, 'value');
        });
    });

    describe('element child', () => {
        it('text binder', () => {
            const binder = getBinder({ inAttributes: false, block: false });
            assert.equal(binder.target, text);
        });

        it('block binder', () => {
            const binder = getBinder({ inAttributes: false, block: true });
            assert.equal(binder.target, block);
        });
    });  

    describe('element attribute', () => {
        it('attribute binder', () => {
            const binder = getBinder({ inAttributes: true, block: false });
            assert.equal(binder.target, attribute);
        });

        it('attribute block binder not yet supported', () => {
            assert.throws(() => getBinder({ inAttributes: true, block: true }), /not yet supported/);
        });
    });

});