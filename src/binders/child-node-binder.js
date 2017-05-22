import Binder from './binder';

export default class ChildNodeBinder extends Binder {

    constructor(options) { 
        super(options);
        this.index = -1;
    }

    bind(el) {
        this.index = el.childIndex;
    }
}
