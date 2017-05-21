import Binder from './binder';

export default class TextBinder extends Binder {

    write() {
        return '<text-node></text-node>';
    }
}
