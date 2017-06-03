import ChildBinder from './child-binder';
import AttributeBinder from './attribute-binder';
import { text, block, attribute } from './targets';

export { ChildBinder, AttributeBinder };
    
export default function getBinder(options) {

    let Type = null, writer = null;
    
    if (options.inAttributes) {
        Type = AttributeBinder;
        if (options.block) {
            throw new Error('Attribute Blocks not yet supported');
        }
        writer = attribute;
    }
    else {
        Type = ChildBinder;
        writer = options.block ? block : text;
    }

    return new Type(options, writer);
}
