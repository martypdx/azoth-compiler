import { base } from 'acorn/dist/walk.es';

export default {
    Program: base.Program,
    ImportDeclaration({ source, specifiers }, state) {
        if(!source.value.endsWith(state.name)) return;
        state.specifiers = specifiers;
    }
};
