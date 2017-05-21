import Binder from './binder';

export default class AttributeBinder extends Binder {
    constructor(options) {
        super(options);
        this.name = options.attr;
    }

    write() {
        return '""';
    }
}
