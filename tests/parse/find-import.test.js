/* global describe, it */
import parse from '../../src/ast';
import findImport from '../../src/parse/find-import';
import chai from 'chai';
const assert = chai.assert;

describe('find import specifier', () => {

    const getSpecifier = source => findImport(parse(source));

    function testSpecifier(specifier, expected = 'html') {
        assert.ok(specifier);
        assert.equal(specifier.local.name, expected);
    }

    it('from import', () => {
        const specifier = getSpecifier(`import { html } from 'diamond';`);
        testSpecifier(specifier);
    });	

    it('from imports', () => {
        const specifier = getSpecifier(`
            import foo from './foo';
            import { html } from 'diamond';
            import bar from './bar'`);
        testSpecifier(specifier);
    });	
    
    it('from alias', () => {
        const specifier = getSpecifier(`import { html as $ } from 'diamond';`);
        testSpecifier(specifier, '$');
    });

    it('in list', () => {
        const specifier = getSpecifier(`import { html, css } from 'diamond';`);
        testSpecifier(specifier);
    });

    it('no import okay', () => {
        const specifier = getSpecifier(`import fs from 'fs';`);
        assert.notOk(specifier);
    });

});