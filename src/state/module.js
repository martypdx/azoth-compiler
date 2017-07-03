import { UniqueStrings } from './unique-strings';
import { Imports } from './imports';
import { renderer } from '../transformers/fragment';
import { initBinder } from '../transformers/binding';

const TAG = '_';
const MODULE_NAME = 'diamond';

export class Module {
    constructor({ tag = TAG } = {}) {
        this.name = MODULE_NAME;
        // TODO: tag comes back from imports
        // because may be aliased
        this.tag = tag;
        this.imports = new Imports({ tag });

        this.fragments = new UniqueStrings();
        this.binders = new UniqueStrings();
        
        this.scope = null;
        this.functionScope = null;
    }

    addDeclarations(body) {
        const { fragments, binders } = this;

        body.splice(0, 0, 
            // TODO: rename: all --> keys
            ...fragments.all.map(renderer), 
            ...binders.values.map(initBinder)
        );
    }

    addFragment(html) {
        return this.fragments.add(html);
    }

    addBinder(binder) {
        this.imports.addBinder(binder);
        
        const name = binder.writeImport();
        const arg = binder.writeInit();
        const value = { name, arg };
        const unique = JSON.stringify(value);
        return this.binders.add(unique, value);
    }
}