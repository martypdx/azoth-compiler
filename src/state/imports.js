import { 
    RENDERER_IMPORT, 
    MAKE_FRAGMENT_IMPORT,
    FIRST_IMPORT,
    MAP_IMPORT,
    COMBINE_IMPORT
} from '../transformers/identifiers';

import { 
    COMBINE, COMBINE_FIRST, 
    FIRST, 
    MAP, MAP_FIRST, 
    SUBSCRIBE, 
    VALUE } from '../binders/binding-types';
import { specifier } from '../transformers/common';

const TEMPLATE_SPECIFIER_NAME = /^html$|^_$/;
const OBSERVABLE_SPECIFIER_NAME = /^\$$/;
const baseNames = [RENDERER_IMPORT, MAKE_FRAGMENT_IMPORT];
const baseSpecifiers = baseNames.map(specifier);

const importSpecifiers = {
    [COMBINE]: COMBINE_IMPORT,
    [COMBINE_FIRST]: COMBINE_IMPORT,
    [FIRST]: FIRST_IMPORT,
    [MAP]: MAP_IMPORT,
    [MAP_FIRST]: MAP_IMPORT,
    [SUBSCRIBE]: null,
    [VALUE]: null,
};

function addSpecifier(specifiers, test) {
    const index = specifiers.findIndex(({ imported }) => test.test(imported.name)); 
    if(index > -1) {
        const name = specifiers[index].local.name;
        specifiers.splice(index, 1);
        return name;
    }
}

export class Imports {
    constructor({ tag, oTag }) {
        this.names = new Set(baseNames);
        this.ast = [];
        this.tag = tag;
        this.oTag = oTag;
    }

    addBinder({ declarations, type }) {
        declarations.forEach(d => d.name && this.addName(d.name));
        const typeImport = importSpecifiers[type];
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
        this.tag = addSpecifier(specifiers, TEMPLATE_SPECIFIER_NAME);
        this.oTag = addSpecifier(specifiers, OBSERVABLE_SPECIFIER_NAME);
        specifiers.push(...baseSpecifiers.slice());
    }
}