import { RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT } from '../transformers/identifiers';
import { specifier } from '../transformers/common';


const SPECIFIER_NAME = 'html';

const baseNames = [RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT];
const baseSpecifiers = baseNames.map(specifier);

export class Imports {
    constructor({ tag }) {
        this.names = new Set(baseNames);
        this._specifiers = [];
        this.tag = tag;
    }

    addBinder(binder) {
        const name = binder.writeImport();
        this.addName(name);
        const typeImport = binder.typeImport;
        if(typeImport) this.addName(typeImport);     
    }

    addName(name) {
        const { _specifiers, names } = this;
        if(!_specifiers || names.has(name)) return;
        names.add(name);
        this._specifiers.push(specifier(name));
    }

    set specifiers(specifiers) {
        this._specifiers = specifiers;
        const index = specifiers.findIndex(({ imported }) => imported.name === SPECIFIER_NAME); 
        if(index > -1) {
            this.tag = specifiers[index].local.name;
            specifiers.splice(index, 1);
        }
        specifiers.push(...specifiers, ...baseSpecifiers.slice());
    }
}