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

    get keys() {
        return [...this.map.keys()];
    }

    get values() {
        return [...this.map.values()];
    }
}

