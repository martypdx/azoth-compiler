
export class UniqueStrings {
    constructor() {
        this.map = new Map();
    }

    add(string, value = {}) {
        const { map } = this;
        if(map.has(string)) return map.get(string).index;
        const index = value.index = map.size;
        map.set(string, value);
        return index;
    }

    set(string, value) {
        this.map.set(string, value);
    }

    get all() {
        return [...this.map.keys()];
    }

    get values() {
        return [...this.map.values()];
    }
}

const TAG = '_';

export class State {
    constructor() {
        this._imports = new UniqueStrings();
        this._binders = new UniqueStrings();
        this._fragments = new UniqueStrings();
        this.tag = TAG;
        this.specifiers = null;
        this.scope = null;
        this.functionScope = null;
    }

    get imports() { return this._imports.all; }
    get binders() { return this._binders.values; }
    get fragments() { return this._fragments.all; }

    addFragment(html) {
        return this._fragments.add(html);
    }

    addBinder(binder) {
        const name = binder.writeImport();
        this._imports.add(name);
        
        const typeImport = binder.typeImport;
        if(typeImport) this._imports.add(typeImport);

        const arg = binder.writeInit();
        const value = { name, arg };
        const unique = JSON.stringify(value);
        return this._binders.add(unique, value);
    }
}