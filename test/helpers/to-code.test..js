import chai from 'chai';
import './to-code';
const assert = chai.assert;
const $ = () => {};

describe('toCode', () => {

    const code = `
        (x, y) => $\`<span>*\${ x + y }</span>\`;
    `.trim();

    it('named function', () => {
        function template () {
            (x, y) => $`<span>*${x + y}</span>`;
        }
         
        assert.equal(template.toCode(), code);
    });

    it('arrow with block', () => {
        const template = () => {
            (x, y) => $`<span>*${x + y}</span>`;
        };

        assert.equal(template.toCode(), code);
    });


    it('arrow no block', () => {
        const template = () => 
            (x, y) => $`<span>*${x + y}</span>`;

        assert.equal(template.toCode() + ';', code);
    });

});


