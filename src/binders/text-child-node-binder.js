import ChildNodeBinder from './child-node-binder';

export default class TextChildNodeBinder extends ChildNodeBinder {

    write() {
        return '<text-node></text-node>';
    }
}
