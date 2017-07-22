export const AT = Symbol('@');
export const DOLLAR = Symbol('$');
export const NONE = Symbol('none');
export const STAR = Symbol('*');
export const ELEMENT = Symbol('<#:');

export const typeMap = {
    '@': AT,
    '$': DOLLAR,
    '': NONE,
    '*': STAR,
    '<#:': ELEMENT,
};