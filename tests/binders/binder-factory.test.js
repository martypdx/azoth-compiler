import getBinder from '../../src/binders/binder-factory';
import { text, block, attribute, property, component } from '../../src/binders/targets';
import { ELEMENT_SIGIL } from '../../src/parse/sigil-types';
import { assert } from 'chai';

describe('binder factory', () => {

    describe('binding type', () => {
        it('passes thru options', () => {
            const binder = getBinder({ inAttributes: false, block: false, sigil: 'test' });
            assert.equal(binder.sigil, 'test');
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

        it('component binder', () => {
            const binder = getBinder({ sigil: ELEMENT_SIGIL });
            assert.equal(binder.target, component);
        });
    });  

    describe('element attribute', () => {
        it('attribute binder', () => {
            const binder = getBinder({ inAttributes: true, block: false });
            assert.equal(binder.target, attribute);
        });

        it('property binder', () => {
            const binder = getBinder({ inAttributes: true, block: false, component: true });
            assert.equal(binder.target, property);
        });

        it('attribute block binder not yet supported', () => {
            assert.throws(() => getBinder({ inAttributes: true, block: true }), /not yet supported/);
        });
    });

});