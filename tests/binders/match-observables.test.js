/*eslint no-undef: off */
import matchObservables from '../../src/binders/match-observables';
import chai from 'chai';
const assert = chai.assert;

describe('match observables', () => {

    const match = source => matchObservables(
        source.toAst(),
        { foo: true, bar: true, qux: true, noMatch: false }
    );
    
    it('match', () => {
        const source = () => foo;
        assert.deepEqual(match(source), ['foo']);
    }); 
    
    it('no match', () => {
        const source = () => noFoo;
        assert.deepEqual(match(source), []);
    }); 

    it('needle in haystack', () => {
        const source = () => noFoo + bar + noMatch;
        assert.deepEqual(match(source), ['bar']);
    });

    it('mixed multiple matches', () => {
        const source = () => noFoo + foo + bar + qux + noMatch;
        assert.deepEqual(match(source), ['foo', 'bar', 'qux']);
    }); 

});

