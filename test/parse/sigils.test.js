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

        it('subscriber', () => {
            assert.deepEqual(sigil('text*'), { 
                block: false ,
                type: 'subscriber', 
                text: 'text'
            });
        });

        it('observer', () => {
            assert.deepEqual(sigil('text@'), { 
                block: false ,
                type: 'observer', 
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

        it('subscriber block', () => {
            assert.deepEqual(sigil('text*#'), {
                block: true,
                type: 'subscriber',
                text: 'text'
            });
        });

        it('escaped subscriber with block', () => {
            assert.deepEqual(sigil('text\\*#'), {
                block: true,
                type: 'value',
                text: 'text*'
            });
        });

        it('observer block', () => {
            assert.deepEqual(sigil('text@#'), {
                block: true,
                type: 'observer',
                text: 'text'
            });
        });

        it('escaped observer with block', () => {
            assert.deepEqual(sigil('text\\@#'), {
                block: true,
                type: 'value',
                text: 'text@'
            });
        });

    });
});
