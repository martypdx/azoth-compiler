
export default class UniqueStrings {
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