import Binder from './binder';
import TextBinder from './text-binder';
import BlockBinder from './block-binder';
import AttributeBinder from './attribute-binder';


export { TextBinder, BlockBinder, AttributeBinder };
    
export class AttributeBlockBinder extends Binder {
    constructor() {
        super();
        throw new Error('Attribute Blocks not yet supported');
    }
}

export default function getBinder(options) {

    if (options.inOpeningTag) {
        return options.block ? new AttributeBlockBinder(options) : new AttributeBinder(options);
    }
    else {
        return options.block ? new BlockBinder(options) : new TextBinder(options);
    }
}
