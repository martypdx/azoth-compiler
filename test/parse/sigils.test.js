import chai from 'chai';
const assert = chai.assert;
import { getBindingType, getBlock } from '../../src/parse/sigil';
import { VALUE, MAP, SUBSCRIBE } from '../../src/binders/binding-types';


describe('sigils', () => {

    describe('binding type', () => {

        function test(text, expected) {
            assert.deepEqual(getBindingType(text), expected);
        }

        it('empty string okay', () => {
            test('', { type: VALUE, text: ''});
        });

        it('value', () => {
            test('text', { type: VALUE, text: 'text' });
        });

        it('map observer', () => {
            test('text*', { type: MAP, text: 'text'});
        });

        it('subscribe', () => {
            test('text@', { type: SUBSCRIBE, text: 'text'});
        });

        it('is end of string', () => {
            test('* ', { type: VALUE, text: '* '});
        });

        it('escaped *', () => {
            test('text\\*', { type: VALUE, text: 'text*' });
        });

        it('escaped @', () => {
            test('text\\@', { type: VALUE, text: 'text@' });
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
