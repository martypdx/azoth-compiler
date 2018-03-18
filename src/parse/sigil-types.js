export const SUBSCRIBE_SIGIL = Symbol('^');
export const ONCE_SIGIL = Symbol('$');
export const NO_SIGIL = Symbol('none');
export const MAP_SIGIL = Symbol('*');
export const ELEMENT_SIGIL = Symbol('<#:');

export const typeMap = {
    '^': SUBSCRIBE_SIGIL,
    '$': ONCE_SIGIL,
    '': NO_SIGIL,
    '*': MAP_SIGIL,
    '<#:': ELEMENT_SIGIL,
};