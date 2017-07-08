/*eslint no-undef: off */
import Binder from '../../src/binders/binder';
import { 
    COMBINE, COMBINE_FIRST, 
    FIRST, 
    MAP, MAP_FIRST, 
    SUBSCRIBE, 
    VALUE } from '../../src/binders/binding-types';
import { AT, NONE, STAR } from '../../src/parse/sigil-types';

import { assert } from 'chai';

describe('Binder', () => {

    it('elIndex and moduleIndex default to -1', () => {
        assert.equal(new Binder().elIndex, -1);
        assert.equal(new Binder().moduleIndex, -1);
    });

    describe('target', () => {

        it('index binder.init', () => {
            const childBinder = new Binder({});
            childBinder.init({ childIndex: 2 });
            assert.equal(childBinder.index, 2);
        });

        it('name binder.init', () => {
            const attrBinder = new Binder({});
            attrBinder.init({}, 'name');
            assert.equal(attrBinder.name, 'name');
        });

        it('declaration', () => {
            const writer = {
                init: binder => binder.foo
            };
            const binder = new Binder({}, writer);
            binder.foo = 'FOO';
            assert.equal(binder.declaration, 'FOO');
        });
    });
    
    describe('binding types', () => {

        const getBinder = options => {
            options.ast = options.expr.toExpr();
            const binder = new Binder(options);
            binder.observables = options.observables || [];
            return binder;
        };

        it('VALUE', () => {
            const binder = getBinder({
                expr: () => foo.length
            });
            assert.equal(binder.type, VALUE);
        }); 

        it('SUBSCRIBE', () => {
            const binder = getBinder({
                expr: () => foo.length,
                sigil: AT
            });
            assert.equal(binder.type, SUBSCRIBE);
        }); 

        it('MAP_FIRST', () => {
            const binder = getBinder({
                expr: () => foo.length, 
                observables:['foo']
            });
            assert.equal(binder.type, MAP_FIRST);
        });        
        
        it('MAP', () => {
            const binder = getBinder({
                expr: () => foo.length, 
                sigil: STAR,
                observables:['foo'],
            });
            assert.equal(binder.type, MAP);
        });   

        it('MAP no observables is VALUE', () => {
            const binder = getBinder({
                expr: () => foo.length,
                sigil: STAR
            });
            assert.equal(binder.type, VALUE);
        }); 

        it('MAP identifer is SUBSCRIBE', () => {
            const binder = getBinder({
                expr: () => foo,
                sigil: STAR,
                observables:['foo']
            });
            assert.equal(binder.type, SUBSCRIBE);
        });  

        it('FIRST', () => {
            const binder = getBinder({
                expr: () => foo,
                observables:['foo']
            });
            assert.equal(binder.type, FIRST);
        });      
        
        it('COMBINE_FIRST', () => {
            const binder = getBinder({
                expr: () => x + y, 
                observables:['x', 'y']
            });
            assert.equal(binder.type, COMBINE_FIRST);
        });        
        
        it('COMBINE', () => {
            const binder = getBinder({
                expr: () => x + y, 
                sigil: STAR,
                observables:['x', 'y']
            });
            assert.equal(binder.type, COMBINE);
        });
        
    });
});
