import { RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT } from '../transformers/identifiers';
import { specifier } from '../transformers/common';

const SPECIFIER_NAME = 'html';
const baseNames = [RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT];
const baseSpecifiers = baseNames.map(specifier);

export class Imports {
    constructor({ tag }) {
        this.names = new Set(baseNames);
        this.ast = [];
        this.tag = tag;
    }

    addBinder({ declaration: { name }, typeImport }) {
        this.addName(name);
        if(typeImport) this.addName(typeImport);     
    }

    addName(name) {
        const { ast, names } = this;
        if(!ast || names.has(name)) return;
        names.add(name);
        this.ast.push(specifier(name));
    }

    set specifiers(specifiers) {
        this.ast = specifiers;
        const index = specifiers.findIndex(({ imported }) => imported.name === SPECIFIER_NAME); 
        if(index > -1) {
            this.tag = specifiers[index].local.name;
            specifiers.splice(index, 1);
        }
        specifiers.push(...baseSpecifiers.slice());
    }
}