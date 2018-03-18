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

const bindingTypeImportMap = {
    [COMBINE]: COMBINE_IMPORT,
    [COMBINE_FIRST]: COMBINE_IMPORT,
    [FIRST]: FIRST_IMPORT,
    [MAP]: MAP_IMPORT,
    [MAP_FIRST]: MAP_IMPORT,
    [SUBSCRIBE]: null,
    [VALUE]: null,
};

const addSpecifier = regex => specifiers => {
    const index = specifiers.findIndex(({ imported }) => regex.test(imported.name)); 
    if(index > -1) {
        const name = specifiers[index].local.name;
        specifiers.splice(index, 1);
        return name;
    }
};

const addTemplateSpecifier = addSpecifier(TEMPLATE_SPECIFIER_NAME);
const addObservableSpecifier = addSpecifier(OBSERVABLE_SPECIFIER_NAME);

const DEFAULT_TEMPLATE_TAG = '_';
const DEFAULT_OBSERVABLE_TAG = '$';
const azothModule = /^azoth$|\/azoth$/;

export class Imports {
    constructor(ast) {
        this.specifiers = [];
        this.names = new Set();
        this.templateTag = DEFAULT_TEMPLATE_TAG;
        this.observableTag = DEFAULT_OBSERVABLE_TAG;

        // This assumes top-level imports only.
        // Reevaluate when async import lands in earnest
        for (let statement of ast.body) {    
            if(statement.type !== 'ImportDeclaration') continue;
            const { source, specifiers } = statement;
            if(!azothModule.test(source.value)) continue;
            this.specifiers = specifiers;
            this.templateTag = addTemplateSpecifier(specifiers);
            this.observableTag = addObservableSpecifier(specifiers);
        }
    }

    addBinder({ declarations, type }) {
        declarations.forEach(d => d.name && this.addName(d.name));
        const typeImport = bindingTypeImportMap[type];
        if(typeImport) this.addName(typeImport);     
    }

    addName(name) {
        const { specifiers, names } = this;
        if(!specifiers || names.has(name)) return;
        names.add(name);
        this.specifiers.push(specifier(name));
    }
}