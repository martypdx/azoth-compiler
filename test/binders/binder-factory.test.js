import getBinder, {
    TextChildNodeBinder,
    BlockChildNodeBinder,
    AttributeBinder
} from '../../src/binders/binder-factory';

import chai from 'chai';
const assert = chai.assert;

describe('binding factory', () => {

    describe('binding type', () => {
        it('passes thru', () => {
            const binder = getBinder({ inOpeningTag: false, block: false, type: 'value' });
            assert.equal(binder.type, 'value');
        });
    });

    describe('element child', () => {
        it('text binder', () => {
            const binder = getBinder({ inOpeningTag: false, block: false });
            assert.instanceOf(binder, TextChildNodeBinder);
        });

        it('block binder', () => {
            const binder = getBinder({ inOpeningTag: false, block: true });
            assert.instanceOf(binder, BlockChildNodeBinder);
        });
    });  

    describe('element attribute', () => {
        it('attribute binder', () => {
            const binder = getBinder({ inOpeningTag: true, block: false });
            assert.instanceOf(binder, AttributeBinder);
        });

        it('attribute block binder not yet supported', () => {
            assert.throws(() => getBinder({ inOpeningTag: true, block: true }), /not yet supported/);
        });
    });

});