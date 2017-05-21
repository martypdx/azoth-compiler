import Binder from './binder';

export default class BlockBinder extends Binder {

    constructor(options) {
        super(options);
        this.index = -1;
    } 
    
    write() {
        return '<block-node></block-node>';
    }
}
