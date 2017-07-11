import Binder from './binder';
import { text, block, attribute } from './targets';
    
export default function getBinder(options) {

    if (options.inAttributes) {
        if (options.block) {
            throw new Error('Attribute Blocks not yet supported');
        }
        options.target = attribute;
    }
    else {
        options.target = options.block ? block : text;
    }

    return new Binder(options);
}
