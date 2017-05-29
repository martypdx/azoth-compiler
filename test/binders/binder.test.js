/*eslint no-undef: off */
import Binder from '../../src/binders/binder';
import ChildBinder from '../../src/binders/child-binder';
import AttributeBinder from '../../src/binders/attribute-binder';

import chai from 'chai';
const assert = chai.assert;

describe('Binder', () => {

    it('elIndex defaults to -1', () => {
        assert.equal(new Binder().elIndex, -1);
    });

    it('isSubscriber', () => {
        assert.isFalse(new Binder({ type: 'value' }).isSubscriber);
        assert.isFalse(new Binder({ type: 'observer' }).isSubscriber);
        assert.isFalse(new Binder({ type: 'observable' }).isSubscriber);
    });

    describe('writer', () => {

        it('ChildBinder init', () => {
            const childBinder = new ChildBinder({});
            childBinder.init({ childIndex: 2 });
            assert.equal(childBinder.index, 2);
        });

        it('AttributeBinder init', () => {
            const attrBinder = new AttributeBinder({});
            attrBinder.init(null, 'name');
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
            assert.deepEqual(binder.writeImport(), { name: writer.import });
            assert.equal(binder.writeInit(), 'FOO');
        });
    });
    
    describe('binding', () => {

        // TODO: .distinctUntilChanged()
        
        it('value identifier', () => {
            const source = () => foo;
            const binder = new Binder(source.toOptions());
            binder.params = ['foo'];
            binder.elIndex = 1;
            const binderIndex = 0;

            // possible REFACTOR direction: 
            // const node = `__nodes[${binder.elIndex}]`;
            // const observer = `__bind${binderIndex}(${node})`;
            // const binding = binder.subscribe()(observer);
            
            const binding = binder.writeBinding(binderIndex);
            const expected = `foo.first().subscribe(__bind0(__nodes[1]))`;
            
            assert.equal(binding, expected);
        });

        it('value expression with single param', () => {
            const source = () => foo + bar;
            const binder = new Binder(source.toOptions());
            binder.params = ['foo'];
            binder.elIndex = 1;
            const binderIndex = 0;

            const binding = binder.writeBinding(binderIndex);
            const expected = `foo.map((foo) => (foo + bar)).first().subscribe(__bind0(__nodes[1]))`;
            
            assert.equal(binding, expected);
        });

        it('value expression with multiple params', () => {
            const source = () => foo + bar;
            const binder = new Binder(source.toOptions());
            binder.params = ['foo', 'bar'];
            binder.elIndex = 1;
            const binderIndex = 0;

            const binding = binder.writeBinding(binderIndex);
            const expected = `combineLatest(foo,bar, (foo,bar) => (foo + bar)).first().subscribe(__bind0(__nodes[1]))`;
            
            assert.equal(binding, expected);
        });

        it('observer identifier', () => {
            const source = () => foo;
            const binder = new Binder(source.toOptions({ type: 'observer' }));
            binder.params = ['foo'];
            binder.elIndex = 1;
            const binderIndex = 0;

            const binding = binder.writeBinding(binderIndex);
            const expected = `foo.subscribe(__bind0(__nodes[1]))`;
            
            assert.equal(binding, expected);
        });

        it('observable identifier', () => {
            const source = () => foo.map(foo => foo + 1);
            const binder = new Binder(source.toOptions({ type: 'observable' }));
            binder.params = ['foo'];
            binder.elIndex = 1;
            const binderIndex = 0;

            const binding = binder.writeBinding(binderIndex);
            const expected = `(foo.map(foo => foo + 1)).subscribe(__bind0(__nodes[1]))`;
            
            assert.equal(binding, expected);
        });

        it('no params', () => {
            const source = () => 1 + 2;
            const binder = new Binder(source.toOptions());
            binder.params = [];
            binder.elIndex = 1;
            const binderIndex = 0;
            
            const binding = binder.writeBinding(binderIndex);
            const expected = `__bind0(__nodes[1])(1 + 2)`;
            
            assert.equal(binding, expected);
        });
    });
});
