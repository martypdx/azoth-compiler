import { ancestor, base } from 'acorn/dist/walk';

const noNestedTTE = Object.assign(base, { TaggedTemplateExpression(){} });
const TAG = { tag: '_' };

export default function getTaggedTemplate(ast, { tag } = TAG) {
    const templates = [];

    ancestor(ast, {
        TaggedTemplateExpression(node, currentAncestors) {
            if (node.tag.name !== tag) return;

            // stack is maintained by acorn on future calls, 
            // so we make a copy to preserve, and also 
            // exclude _this_ node from own ancestor stack
            const ancestors = currentAncestors.slice(0, -1);

            templates.push({
                node,
                ancestors 
            });
        }
    }, noNestedTTE);

    return templates;
}
