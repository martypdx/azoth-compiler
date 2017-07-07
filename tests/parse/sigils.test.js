import chai from 'chai';
const assert = chai.assert;
import { getBindingType, getBlock } from '../../src/parse/sigil';
import { NONE, STAR, AT } from '../../src/parse/sigil-types';


describe('sigils', () => {

    describe('binding type', () => {

        function test(text, expected) {
            assert.deepEqual(getBindingType(text), expected);
        }

        it('empty string okay', () => {
            test('', { sigil: NONE, text: ''});
        });

        it('value', () => {
            test('text', { sigil: NONE, text: 'text' });
        });

        it('map observer', () => {
            test('text*', { sigil: STAR, text: 'text'});
        });

        it('subscribe', () => {
            test('text@', { sigil: AT, text: 'text'});
        });

        it('is end of string', () => {
            test('* ', { sigil: NONE, text: '* '});
        });

        it('escaped *', () => {
            test('text\\*', { sigil: NONE, text: 'text*' });
        });

        it('escaped @', () => {
            test('text\\@', { sigil: NONE, text: 'text@' });
        });
    });


    describe('block', () => {

        function test(text, expected) {
            assert.deepEqual(getBlock(text), expected);
        }

        it('empty string okay', () => {
            test('', { block: false, text: '' });
        });

        it('no block', () => {
            test('text', { block: false, text: 'text' });
        });

        it('block', () => {
            test('#text', { block: true, text: 'text' });
        });

        it('escaped block', () => {
            test('\\#text', { block: false, text: '#text' });
        });


    });
});
