import { assert } from 'chai';
import { UniqueStrings } from '../../src/state/unique-strings';


describe('Unique strings', () => {

    const collection = new UniqueStrings();

    it('returns new index on add', () => {
        assert.equal(collection.add('some string'), 0);
        assert.equal(collection.add('another string'), 1);
    });

    it('returns index of previous string', () => {
        assert.equal(collection.add('some string'), 0);
        assert.equal(collection.add('another string'), 1);
    });

    it('and does new strings again', () => {
        assert.equal(collection.add('new one'), 2);
    });

    it('returns all as array', () => {
        assert.deepEqual(collection.keys, [
            'some string',
            'another string',
            'new one',
        ]);
    });
});