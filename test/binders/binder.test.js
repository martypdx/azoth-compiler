/*eslint no-undef: off */
import Binder from '../../src/binders/binder';
import chai from 'chai';
const assert = chai.assert;

describe('Binder', () => {
    
    it('elIndex defaults to -1', () => {
        assert.equal(new Binder().elIndex, -1);
    });

    it('calculates and recurses', () => {
        const source = () => condition && _`${foo}`;

        const ast = source.toAst();
        const binder = new Binder({ ast, block: true });

        const identifiers = new Set(['foo']);
        const templates = [];
        const recurse = passed => {
            assert.equal(passed, ast);
            return templates;
        };
        binder.calculate({ identifiers, recurse });
        assert.equal(binder.templates, templates);
        assert.deepEqual(binder.params, ['foo']);
    });

});
