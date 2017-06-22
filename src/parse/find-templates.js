import { simple, base } from 'acorn/dist/walk.es';


// TODO: manage scope if needed via ancestor walk
// stack is maintained by acorn on future calls, 
// so we make a copy to preserve current stack, 
// and also exclude _this_ node from own ancestor stack
// const ancestors = currentAncestors.slice(0, -1);

const TAG = '_';

export default function findTemplates(ast, { tag = TAG } = {}) {
    const templates = [];
    
    simple(ast, {
        TaggedTemplateExpression(node, st) {
            if (node.tag.name !== tag) return;
            st.push(node);
        },

    }, base, templates);

    return templates;
}
