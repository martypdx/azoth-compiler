import Binder from './binder';

// const attrPattern = /\s*?([a-zA-Z0-9\-]+?)=$/;

// const specials = {
//     on: 'event',
//     class: 'class'
// };

const BINDER = '__attrBinder';
const HTML = '""';

export default class AttributeBinder extends Binder {
    
    constructor(options, writer) {
        super(options, writer);
        this.name = '';
    }

    init(el, attr) {
        // if (parts.length > 1 && (type = specials[parts[0]])) {
        //     delete currentEl.attributes[name];
        // }
        this.name = attr;
    }

    writeHtml() {
        return HTML;
    }

    writeImport() {
        return { named: BINDER };
    }

    writeInit() {
        return `${BINDER}('${this.name}')`;
    }
}
