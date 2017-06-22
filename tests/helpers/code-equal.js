import parse from '../../src/ast';
import { generate } from 'astring';
import chai from 'chai';
const assert = chai.assert;

const stripParse = code => {
    const ast = parse(code);
    return generate(ast, { indent: '    ' });
};

const tryParse = (name, code) => {
    try {
        return stripParse(code);
    }
    catch (err) {
        console.log('FAILED PARSE:', name, '\nERROR:', err, '\nCODE:\n', code);
        throw err;
    }
};

export default function codeEqual(actual, expected) {
    if(typeof expected !== 'string') expected = expected.toCode();
    const parsedActual = tryParse('actual', actual);
    const parsedExpected = tryParse('expected', expected);
    assert.equal(parsedActual, parsedExpected);
}
