import { ancestor, base } from 'acorn/dist/walk';

const noNestedTTE = Object.assign(base, { TaggedTemplateExpression(){} });
const TAG = '_';

export default function findTemplates(ast, { tag = TAG } = {}) {
    const templates = [];
    
    ancestor(ast, {
        TaggedTemplateExpression(node, currentAncestors) {
            if (node.tag.name !== tag) return;

            // stack is maintained by acorn on future calls, 
            // so we make a copy to preserve current stack, 
            // and also exclude _this_ node from own ancestor stack
            const ancestors = currentAncestors.slice(0, -1);

            templates.push({
                node,
                ancestors 
            });
        }
    }, noNestedTTE);

    return templates;
}
