import ChildBinder from './child-binder';
import AttributeBinder from './attribute-binder';
import { text, block, attribute } from './targets';

export { ChildBinder, AttributeBinder };
    
export default function getBinder(options) {

    let Type = null, target = null;
    
    if (options.inAttributes) {
        Type = AttributeBinder;
        if (options.block) {
            throw new Error('Attribute Blocks not yet supported');
        }
        target = attribute;
    }
    else {
        Type = ChildBinder;
        target = options.block ? block : text;
    }

    return new Type(options, target);
}
