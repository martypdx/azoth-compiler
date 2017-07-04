import Binder from './binder';
import { text, block, attribute } from './targets';
    
export default function getBinder(options) {

    let target = null;
    
    if (options.inAttributes) {
        if (options.block) {
            throw new Error('Attribute Blocks not yet supported');
        }
        target = attribute;
    }
    else {
        target = options.block ? block : text;
    }

    return new Binder(options, target);
}
