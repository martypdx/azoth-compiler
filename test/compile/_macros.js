import compile from '../../src/compilers/compile.js';

export function fromString(t, source) {
    t.snapshot(compile(source));
}

export function fromSource(t, source) {
    t.snapshot(compile(source.toCode()));
}