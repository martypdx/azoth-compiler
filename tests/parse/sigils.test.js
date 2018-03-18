import chai from 'chai';
const assert = chai.assert;
import { getBindingType, getBlock } from '../../src/parse/sigil';
import { SUBSCRIBE_SIGIL, ONCE_SIGIL, NO_SIGIL, MAP_SIGIL, ELEMENT_SIGIL } from '../../src/parse/sigil-types';


describe('sigils', () => {

    function test(text, expected) {
        assert.deepEqual(getBindingType(text), expected);
    }
    
    describe('binding type', () => {


        it('empty string okay', () => {
            test('', { sigil: NO_SIGIL, text: ''});
        });

        it('NO_SIGIL', () => {
            test('text', { sigil: NO_SIGIL, text: 'text' });
        });

        it('MAP_SIGIL', () => {
            test('text*', { sigil: MAP_SIGIL, text: 'text'});
        });

        it('SUBSCRIBE_SIGIL', () => {
            test('text^', { sigil: SUBSCRIBE_SIGIL, text: 'text'});
        });

        it('ONCE_SIGIL', () => {
            test('text$', { sigil: ONCE_SIGIL, text: 'text'});
        });

        it('is end of string', () => {
            test('* ', { sigil: NO_SIGIL, text: '* '});
        });

        it('escaped *', () => {
            test('text\\*', { sigil: NO_SIGIL, text: 'text*' });
        });

        it('escaped ^', () => {
            test('text\\^', { sigil: NO_SIGIL, text: 'text^' });
        });

        it('escaped $', () => {
            test('text\\$', { sigil: NO_SIGIL, text: 'text$' });
        });

        it('component element', () => {
            test('text<#:', { sigil: ELEMENT_SIGIL, text: 'text' });
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

    describe('not allowed errors', () => {

        it('sigils on components not supported', done => {
            try {
                test('<#:*');
                done('expected error');
            }
            catch(err) {
                assert.match(err.message, /not currently supported/);
                done();
            }
        });
    });
});
