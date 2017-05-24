import Binder from './binder';
import TextChildNodeBinder from './text-child-node-binder';
import BlockChildNodeBinder from './block-child-node-binder';
import AttributeBinder from './attribute-binder';


export { TextChildNodeBinder, BlockChildNodeBinder, AttributeBinder };
    
export class AttributeBlockBinder extends Binder {
    constructor() {
        super();
        throw new Error('Attribute Blocks not yet supported');
    }
}

export default function getBinder(options) {

    if (options.inAttributes) {
        return options.block ? new AttributeBlockBinder(options) : new AttributeBinder(options);
    }
    else {
        return options.block ? new BlockChildNodeBinder(options) : new TextChildNodeBinder(options);
    }
}
