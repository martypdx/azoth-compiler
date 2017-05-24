import htmlparser from 'htmlparser2';
import chai from 'chai';
const assert = chai.assert;

describe.skip('assumptions', () => {

    it('closes void elements', () => {
        const handler = {
            onopentag(...args) {
                console.log(args);
            },
            onclosetag(name) {
                console.log(name);
            }
        };

        const parser = new htmlparser.Parser(handler);
        parser.write('<input><p><br>content</p>');
        parser.end();
    });  

});