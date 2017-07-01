/*eslint no-undef: off */
import matchObservables from '../../src/binders/match-observables';
import chai from 'chai';
const assert = chai.assert;

describe.skip('match observables', () => {

    const match = source => matchObservables(
        source.toAst(),
        new Set(['foo', 'bar', 'qux'])
    );
    
    it('match', () => {
        const source = () => foo;
        assert.deepEqual(match(source), ['foo']);
    }); 
    
    it('no match', () => {
        const source = () => noFoo;
        assert.deepEqual(match(source), []);
    }); 

    it('multiple matches', () => {
        const source = () => foo + bar + qux;
        assert.deepEqual(match(source), ['foo', 'bar', 'qux']);
    }); 

    it('mixed', () => {
        const source = () => noFoo + bar;
        assert.deepEqual(match(source), ['bar']);
    });
});

