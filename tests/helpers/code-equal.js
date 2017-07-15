import { parse, generate } from '../../src/ast';
import { assert } from 'chai';

const stripParse = code => {
    const ast = parse(code);
    return generateCode(ast);
};

const generateCode = (ast) => generate(ast, { indent: '    ' });

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
    if(typeof expected === 'function') expected = expected.toCode();
    const parsedActual = typeof actual === 'string' ? tryParse('actual', actual) : generateCode(actual);
    const parsedExpected = tryParse('expected', expected);
    assert.equal(parsedActual, parsedExpected);
}
