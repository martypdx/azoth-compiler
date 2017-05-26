import Binder from './binder';

export default class ChildNodeBinder extends Binder {

    constructor(options, writer) { 
        super(options, writer);
        this.index = -1;
    }

    init(el) {
        this.index = el.childIndex;
    }
}
