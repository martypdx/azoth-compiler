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

            const binder = new ChildBinder({}, writer);
            binder.foo = 'FOO';
            
            assert.equal(binder.writeHtml(), writer.html);
            assert.deepEqual(binder.writeImport(), { name: writer.import });
            assert.equal(binder.writeInit(), 'FOO');
        });
    });
    
    describe.only('binding', () => {
        const getAst = source => source.toAst().body[0].expression;
        const getOptions = (source, options = {}) => Object.assign(options, { ast: getAst(source) });

        it('value identifier', () => {
            const source = () => foo;
            const binder = new ChildBinder(getOptions(source));
            binder.params = ['foo'];
            binder.elIndex = 1;

            const binding = binder.writeBinding(0);
            const expected = `foo.first().subscribe(__bind0(__nodes[1]));`;
            
            assert.equal(binding, expected);
        });

        it('value expression with single param', () => {
            const source = () => foo + bar;
            const binder = new ChildBinder(getOptions(source));
            binder.params = ['foo'];
            binder.elIndex = 1;

            const binding = binder.writeBinding(0);
            const expected = `foo.map((foo) => (foo + bar)).first().subscribe(__bind0(__nodes[1]));`;
            
            assert.equal(binding, expected);
        });

        it('value expression with multiple params', () => {
            const source = () => foo + bar;
            const binder = new ChildBinder(getOptions(source));
            binder.params = ['foo', 'bar'];
            binder.elIndex = 1;

            const binding = binder.writeBinding(0);
            const expected = `combineLatest(foo,bar, (foo,bar) => (foo + bar)).first().subscribe(__bind0(__nodes[1]));`;
            
            assert.equal(binding, expected);
        });

        it('observer identifier', () => {
            const source = () => foo;
            const binder = new ChildBinder(getOptions(source, { type: 'observer' }));
            binder.params = ['foo'];
            binder.elIndex = 1;

            const binding = binder.writeBinding(0);
            const expected = `foo.subscribe(__bind0(__nodes[1]));`;
            
            assert.equal(binding, expected);
        });

        it('observable identifier', () => {
            const source = () => foo.map(foo => foo + 1);
            const binder = new ChildBinder(getOptions(source, { type: 'observable' }));
            binder.params = ['foo'];
            binder.elIndex = 1;

            const binding = binder.writeBinding(0);
            const expected = `(foo.map(foo => foo + 1)).subscribe(__bind0(__nodes[1]));`;
            
            assert.equal(binding, expected);
        });


        // TODO expressions with no param
    });
});
