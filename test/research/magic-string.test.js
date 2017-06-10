import chai from 'chai';
const assert = chai.assert;
import MagicString from 'magic-string';

describe.skip('Magic String', () => {

    it('ident', () => {
        const source = `
    one;
    two;
    three;`;
        const s = new MagicString(source);
        assert.equal(s.toString(), source);
        s.indent();
        assert.equal(s.toString(), source, 'AFTER');
    });
});