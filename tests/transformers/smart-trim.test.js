import { assert } from 'chai'; 
import smartTrim from '../../src/transformers/smart-trim';

describe('smart trim', () => {

    describe('removes leading', () => {
        it('new line', () => {
            const trimmed = smartTrim('\nHello');
            assert.equal(trimmed, 'Hello');
        });
    
        it('spaces and new line', () => {
            const trimmed = smartTrim('    \nHello');
            assert.equal(trimmed, 'Hello');
        });
    
        it('new line and trailing spaces', () => {
            const trimmed = smartTrim('\n    Hello');
            assert.equal(trimmed, 'Hello');
        });
    
        it('spaces, new line, and spaces', () => {
            const trimmed = smartTrim('    \n    Hello');
            assert.equal(trimmed, 'Hello');
        });
    });

    describe('removes trailing', () => {
        it('new line', () => {
            const trimmed = smartTrim('Hello\n');
            assert.equal(trimmed, 'Hello');
        });
    
        it('spaces and new line', () => {
            const trimmed = smartTrim('Hello    \n');
            assert.equal(trimmed, 'Hello');
        });
    
        it('new line and trailing spaces', () => {
            const trimmed = smartTrim('Hello\n    ');
            assert.equal(trimmed, 'Hello');
        });
    
        it('spaces, new line, and spaces', () => {
            const trimmed = smartTrim('Hello    \n    ');
            assert.equal(trimmed, 'Hello');
        });
    });

    describe('leading and trailing', () => {
        it('spaces, new line, and spaces', () => {
            const trimmed = smartTrim('    \n    Hello    \n    ');
            assert.equal(trimmed, 'Hello');
        });
    });

    describe('does not remove without newline', () => {
        it('leading spaces', () => {
            const trimmed = smartTrim('    Hello');
            assert.equal(trimmed, '    Hello');
        });

        it('trailing spaces', () => {
            const trimmed = smartTrim('Hello    ');
            assert.equal(trimmed, 'Hello    ');
        });

        it('leading and trailing spaces', () => {
            const trimmed = smartTrim('    Hello    ');
            assert.equal(trimmed, '    Hello    ');
        });
    });

});