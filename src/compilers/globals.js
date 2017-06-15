
export class UniqueStrings {
    constructor() {
        this.map = new Map();
    }

    add(string) {
        const { map } = this;
        if(map.has(string)) return map.get(string);
        const size = map.size;
        map.set(string, size);
        return size;
    }

    get all() {
        return [...this.map.keys()];
    }
}

export class Globals {
    constructor() {
        this._imports = new UniqueStrings();
        this._binders = new UniqueStrings();
        this._fragments = new UniqueStrings();
    }

    get imports() { return this._imports.all; }
    get binders() { return this._binders.all; }
    get fragments() { return this._fragments.all; }

    addFragment(html) {
        return this._fragments.add(html);
    }

    addBinder(binder) {
        this._imports.add(binder.writeImport());
        return this._binders.add(binder.writeInit());
    }
}