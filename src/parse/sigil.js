import { VALUE, MAP, SUBSCRIBE } from '../binders/binding-types';

const types = {
    '*': MAP,
    '@': SUBSCRIBE
};

const escapedBindingMatch = /\\[#*@]$/;
const bindingMatch = /[\*@]$/;

export function getBindingType(text) {

    const tryEscaped = () => {
        let escaped = false;
        text = text.replace(escapedBindingMatch, m => {
            escaped = true;
            return m[m.length - 1];
        });
        return escaped;
    };

    let type = VALUE;

    if(tryEscaped()) return { type, text };

    text = text.replace(bindingMatch, m => {
        type = types[m];
        return '';
    });

    return { type, text };
}

const escapedBlockMatch = /^\\#/;
const blockMatch = /^#/;

export function getBlock(text) {

    const tryEscaped = () => {
        let escaped = false;
        text = text.replace(escapedBlockMatch, m => {
            escaped = true;
            return m[m.length - 1];
        });
        return escaped;
    };

    let block = false;

    if(tryEscaped()) {
        return {
            block, 
            text
        };
    }

    text = text.replace(blockMatch, () => {
        block = true;
        return '';
    });

    return { block, text };
}
