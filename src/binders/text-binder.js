import Binder from './binder';

export default class TextBinder extends Binder {

    constructor(options) {
        super(options);
        this.index = -1;
    } 
    
    write() {
        return '<text-node></text-node>';
    }
}
