import Binder from './binder';

export default class ChildNodeBinder extends Binder {

    constructor(options, target) { 
        super(options, target);
        this.index = -1;
    }

    // init(el) {
    //     this.index = el.childIndex;
    // }
}
