/*eslint no-undef: off */
import getObservables from '../../src/binders/get-observables';
import chai from 'chai';
const assert = chai.assert;

describe('get observables', () => {
    
    it('single identifier', () => {
        const source = () => foo;
        assert.deepEqual(
            getObservables(source.toAst(), new Set(['foo'])),
            ['foo']
        );
    }); 

    it('two matches, one non-match', () => {
        const source = () => foo + bar;
        assert.deepEqual(
            getObservables(source.toAst(), new Set(['foo', 'bar', 'qux'])),
            ['foo', 'bar']
        );
    }); 

    it('no match', () => {
        const source = () => foo;
        assert.deepEqual(
            getObservables(source.toAst(), new Set(['qux'])),
            []
        );
    });

    it('mixed', () => {
        const source = () => foo + bar;
        assert.deepEqual(
            getObservables(source.toAst(), new Set(['bar', 'qux'])),
            ['bar']
        );
    });
});

