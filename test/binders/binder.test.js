/*eslint no-undef: off */
import Binder from '../../src/binders/binder';
import ChildBinder from '../../src/binders/child-binder';
import AttributeBinder from '../../src/binders/attribute-binder';

import chai from 'chai';
const assert = chai.assert;



describe.only('Binder', () => {

    describe('writer', () => {
        it('elIndex defaults to -1', () => {
            assert.equal(new Binder().elIndex, -1);
        });

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
    

});
