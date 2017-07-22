import Binder from './binder';
import { ELEMENT } from '../parse/sigil-types';
import { text, block, attribute, component } from './targets';
    
export default function getBinder(options) {

    if(options.sigil === ELEMENT) {
        options.target = component;
    }
    else if (options.inAttributes) {
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
