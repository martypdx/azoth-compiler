import { NO_SIGIL, typeMap } from './sigil-types';

// TODO: get the values from sigil types.
// TODO: make regex and escape version from base string
const escapedBindingMatch = /\\(\*|\^|\$|<#:)$/;
const errorBindingMatch = /<#:(\*|\^|\$)$/;
const bindingMatch = /(\*|\^|\$|<#:)$/;

export function getBindingType(text) {

    if(errorBindingMatch.test(text)) {
        throw new Error('Binding sigils with components are not currently supported');
    }

    const tryEscaped = () => {
        let escaped = false;
        text = text.replace(escapedBindingMatch, m => {
            escaped = true;
            return m[m.length - 1];
        });
        return escaped;
    };

    let sigil = NO_SIGIL;

    if(tryEscaped()) return { sigil, text };

    text = text.replace(bindingMatch, m => {
        sigil = typeMap[m];
        return '';
    });

    return { sigil, text };
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
