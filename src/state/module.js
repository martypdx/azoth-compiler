import { UniqueStrings } from './unique-strings';
import { Imports } from './imports';

const TAG = '_';
const MODULE_NAME = 'diamond';

export class Module {
    constructor({ tag = TAG } = {}) {
        this.name = MODULE_NAME;
        // TODO: tag comes back from imports
        // because may be aliased
        this.tag = tag;
        this.imports = new Imports({ tag });

        this._binders = new UniqueStrings();
        this._fragments = new UniqueStrings();
        
        this.specifiers = null;
        this.scope = null;
        this.functionScope = null;
    }

    get binders() { return this._binders.values; }
    get fragments() { return this._fragments.all; }

    addFragment(html) {
        return this._fragments.add(html);
    }

    addBinder(binder) {
        this.imports.addBinder(binder);
        
        const name = binder.writeImport();
        const arg = binder.writeInit();
        const value = { name, arg };
        const unique = JSON.stringify(value);
        return this._binders.add(unique, value);
    }
}