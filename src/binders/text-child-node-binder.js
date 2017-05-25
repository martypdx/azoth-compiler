import ChildNodeBinder from './child-node-binder';

export default class TextChildNodeBinder extends ChildNodeBinder {

    writeHtml() {
        return '<text-node></text-node>';
    }
}
