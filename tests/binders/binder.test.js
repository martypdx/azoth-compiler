/*eslint no-undef: off */
import Binder from '../../src/binders/binder';
import { 
    COMBINE, COMBINE_FIRST, 
    FIRST, 
    MAP, MAP_FIRST, 
    SUBSCRIBE, 
    VALUE } from '../../src/binders/binding-types';
import { SUBSCRIBE_SIGIL, ONCE_SIGIL, NO_SIGIL, MAP_SIGIL } from '../../src/parse/sigil-types';

import { assert } from 'chai';

describe('Binder', () => {

    it('defaults', () => {
        assert.equal(new Binder().sigil, NO_SIGIL);
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

        it('declarations', () => {
            const target = {
                init: binder => binder.foo
            };
            const binder = new Binder({ target });
            binder.foo = 'FOO';
            assert.deepEqual(binder.declarations, ['FOO']);
        });
    });
    
    describe('binding types', () => {

        const getBinder = options => {
            options.ast = options.expr.toExpr();
            const binder = new Binder(options);
            binder.observables = options.observables || [];
            return binder;
        };

        it('SUBSCRIBE', () => {
            const binder = getBinder({
                expr: () => foo.length,
                sigil: SUBSCRIBE_SIGIL
            });
            assert.equal(binder.type, SUBSCRIBE);
        }); 

        it('no sigil is VALUE', () => {
            const binder = getBinder({
                expr: () => foo.length,
                observables: ['foo']
            });
            assert.equal(binder.type, VALUE);
        }); 

        it('no observables is VALUE', () => {
            const binder = getBinder({
                expr: () => foo.length, 
                sigil: MAP_SIGIL
            });
            assert.equal(binder.type, VALUE);
        });        
        
        it('MAP', () => {
            const binder = getBinder({
                expr: () => foo.length, 
                sigil: MAP_SIGIL,
                observables:['foo'],
            });
            assert.equal(binder.type, MAP);
        }); 

        it('MAP_FIRST', () => {
            const binder = getBinder({
                expr: () => foo.length, 
                sigil: ONCE_SIGIL,
                observables:['foo'],
            });
            assert.equal(binder.type, MAP_FIRST);
        });   

        it('MAP no observables is VALUE', () => {
            const binder = getBinder({
                expr: () => foo.length,
                sigil: MAP_SIGIL
            });
            assert.equal(binder.type, VALUE);
        }); 

        it('MAP identifer is SUBSCRIBE', () => {
            const binder = getBinder({
                expr: () => foo,
                sigil: MAP_SIGIL,
                observables:['foo']
            });
            assert.equal(binder.type, SUBSCRIBE);
        });  

        it('FIRST', () => {
            const binder = getBinder({
                expr: () => foo,
                observables:['foo'],
                sigil: ONCE_SIGIL
            });
            assert.equal(binder.type, FIRST);
        });      
        
        it('COMBINE_FIRST', () => {
            const binder = getBinder({
                expr: () => x + y, 
                observables:['x', 'y'],
                sigil: ONCE_SIGIL
            });
            assert.equal(binder.type, COMBINE_FIRST);
        });        
        
        it('COMBINE', () => {
            const binder = getBinder({
                expr: () => x + y, 
                sigil: MAP_SIGIL,
                observables:['x', 'y']
            });
            assert.equal(binder.type, COMBINE);
        });
        
    });

    describe('properties', () => {
        it('adds property binders to declarations', () => {
            const target = {
                init: binder => ({ 
                    name: 'propBinder',
                    arg: binder.name
                })
            };
            
            const prop1 = new Binder({ target });
            prop1.init({}, 'foo');
            const prop2 = new Binder({ target });
            prop2.init({}, 'bar');

            const binder = new Binder({ target: {
                init: () => 'parent'
            }});
            binder.properties = [prop1, prop2];

            assert.deepEqual(binder.declarations, [
                'parent',
                { name: 'propBinder', arg: 'foo' },
                { name: 'propBinder', arg: 'bar' },
            ]);

        });
    });
});
