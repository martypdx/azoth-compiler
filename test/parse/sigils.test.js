import chai from 'chai';
const assert = chai.assert;
import sigil from '../../src/parse/sigil';


describe('sigils', () => {

    describe('text', () => {

        it('empty string is value', () => {
            assert.deepEqual(sigil(''), { 
                block: false,
                type: 'value', 
                text: ''
            });
        });

        it('value', () => {
            assert.deepEqual(sigil('text'), { 
                block: false,
                type: 'value', 
                text: 'text' 
            });
        });

        it('observer', () => {
            assert.deepEqual(sigil('text*'), { 
                block: false ,
                type: 'observer', 
                text: 'text'
            });
        });

        it('observable', () => {
            assert.deepEqual(sigil('text@'), { 
                block: false ,
                type: 'observable', 
                text: 'text'
            });
        });

        it('is end of string', () => {
            assert.deepEqual(sigil('* '), { 
                block: false,
                type: 'value', 
                text: '* '
            });
        });

        it('escaped *', () => {
            assert.deepEqual(sigil('text\\*'), { 
                block: false,
                type: 'value', 
                text: 'text*' 
            });
        });

        it('escaped @', () => {
            assert.deepEqual(sigil('text\\@'), { 
                block: false,
                type: 'value', 
                text: 'text@' 
            });
        });

    });

    describe('block', () => {

        it('block', () => {
            assert.deepEqual(sigil('text#'), {
                block: true,
                type: 'value',
                text: 'text'
            });
        });

        it('escaped #', () => {
            assert.deepEqual(sigil('text\\#'), { 
                block: false,
                type: 'value', 
                text: 'text#' 
            });
        });

        it('observer block', () => {
            assert.deepEqual(sigil('text*#'), {
                block: true,
                type: 'observer',
                text: 'text'
            });
        });

        it('escaped observer with block', () => {
            assert.deepEqual(sigil('text\\*#'), {
                block: true,
                type: 'value',
                text: 'text*'
            });
        });

        it('observable block', () => {
            assert.deepEqual(sigil('text@#'), {
                block: true,
                type: 'observable',
                text: 'text'
            });
        });

        it('escaped observable with block', () => {
            assert.deepEqual(sigil('text\\@#'), {
                block: true,
                type: 'value',
                text: 'text@'
            });
        });

    });
});
