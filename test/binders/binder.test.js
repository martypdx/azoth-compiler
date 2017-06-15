/*eslint no-undef: off */
import Binder from '../../src/binders/binder';
import ChildBinder from '../../src/binders/child-binder';
import AttributeBinder from '../../src/binders/attribute-binder';
import { /*VALUE,*/ MAP, SUBSCRIBE } from '../../src/binders/binding-types';

import chai from 'chai';
const assert = chai.assert;

describe('Binder', () => {

    it('elIndex and moduleIndex default to -1', () => {
        assert.equal(new Binder().elIndex, -1);
        assert.equal(new Binder().moduleIndex, -1);
    });

    it('isSubscriber', () => {
        assert.isFalse(new Binder({ type: 'value' }).isSubscriber);
        assert.isFalse(new Binder({ type: 'observer' }).isSubscriber);
        assert.isFalse(new Binder({ type: 'observable' }).isSubscriber);
    });

    describe('target', () => {

        it('ChildBinder init', () => {
            const childBinder = new ChildBinder({});
            childBinder.init({ childIndex: 2 });
            assert.equal(childBinder.index, 2);
        });

        it('AttributeBinder init', () => {
            const attrBinder = new AttributeBinder({});
            attrBinder.init({}, 'name');
            assert.equal(attrBinder.name, 'name');
        });

        it('writes', () => {
            const writer = {
                html: 'html',
                import: '__import',
                init: binder => binder.foo
            };

            const binder = new Binder({}, writer);
            binder.foo = 'FOO';
            
            assert.equal(binder.writeHtml(), writer.html);
            assert.deepEqual(binder.writeImport(), writer.import);
            assert.equal(binder.writeInit(), 'FOO');
        });
    });
    
    describe.skip('binding', () => {

        const OBSERVER = '<observer>';

        // TODO: .distinctUntilChanged()
        
        it('value identifier', () => {
            const source = () => foo;
            const binder = new Binder({ ast: source.toExpr() });
            binder.params = ['foo'];

            const binding = binder.writeBinding(OBSERVER);
            const expected = `foo.first().subscribe(${OBSERVER})`;
            
            assert.equal(binding, expected);
        });

        it('value expression with single param', () => {
            const source = () => foo + bar;
            const binder = new Binder({ ast: source.toExpr() });
            binder.params = ['foo'];

            const binding = binder.writeBinding(OBSERVER);
            const expected = `foo.map((foo) => (foo + bar)).first().subscribe(${OBSERVER})`;
            
            assert.equal(binding, expected);
        });

        it('value expression with multiple params', () => {
            const source = () => foo + bar;
            const binder = new Binder({ ast: source.toExpr() });
            binder.params = ['foo', 'bar'];

            const binding = binder.writeBinding(OBSERVER);
            const expected = `combineLatest(foo,bar, (foo,bar) => (foo + bar)).first().subscribe(${OBSERVER})`;
            
            assert.equal(binding, expected);
        });

        it('map identifier', () => {
            const source = () => foo;
            const binder = new Binder({ ast: source.toExpr(), type: MAP });
            binder.params = ['foo'];

            const binding = binder.writeBinding(OBSERVER);
            const expected = `foo.subscribe(${OBSERVER})`;
            
            assert.equal(binding, expected);
        });

        it('subscribe identifier', () => {
            const source = () => foo.map(foo => foo + 1);
            const binder = new Binder({ ast: source.toExpr(), type: SUBSCRIBE });
            binder.params = ['foo'];

            const binding = binder.writeBinding(OBSERVER);
            const expected = `(foo.map(foo => foo + 1)).subscribe(${OBSERVER})`;
            
            assert.equal(binding, expected);
        });

        it('no params', () => {
            const source = () => 1 + 2;
            const binder = new Binder({ ast: source.toExpr() });
            binder.params = [];
            
            const binding = binder.writeBinding(OBSERVER);
            const expected = `${OBSERVER}(1 + 2)`;
            
            assert.equal(binding, expected);
        });

        it('static expression, no params', () => {
            const source = () => x  + y;
            const binder = new Binder({ ast: source.toExpr() });
            binder.params = [];
            
            const binding = binder.writeBinding(OBSERVER);
            const expected = `${OBSERVER}(x + y)`;
            
            assert.equal(binding, expected);
        });
    });
});
