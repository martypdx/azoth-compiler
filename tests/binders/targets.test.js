import { text, block, attribute, component } from '../../src/binders/targets';

import chai from 'chai';
const assert = chai.assert;

describe('binder targets', () => {

    it('text', () => {
        assert.equal(text.html, '<text-node></text-node>');
        assert.strictEqual(text.isBlock, false);
        assert.strictEqual(text.isComponent, false);
        assert.deepEqual(
            text.init({ index: 2 }), 
            { name: '__textBinder', arg: 2 }
        );
    });

    it('block', () => {
        assert.equal(block.html, '<!-- block -->');
        assert.strictEqual(block.isBlock, true);
        assert.strictEqual(block.isComponent, false);
        assert.deepEqual(
            block.init({ index: 2 }), 
            { name: '__blockBinder', arg: 2 }
        );
    });
    
    it('attribute', () => {
        assert.equal(attribute.html, '""');
        assert.strictEqual(text.isBlock, false);
        assert.strictEqual(text.isComponent, false);
        assert.deepEqual(
            attribute.init({ name: 'name' }), 
            { name: '__attrBinder', arg: 'name' }
        );
    });

    it('component', () => {
        assert.equal(component.html, '<!-- component -->');
        assert.strictEqual(component.isBlock, true);
        assert.strictEqual(component.isComponent, true);
        assert.deepEqual(
            component.init({ index: 2 }), 
            { name: '__componentBinder', arg: 2 }
        );    
    });
});
