import { ancestor, base } from 'acorn/dist/walk';

const noNestedTTE = Object.assign(base, { TaggedTemplateExpression(){} });

export default function getTaggedTemplate(ast, { tag }) {
    const templates = [];

    ancestor(ast, {
        TaggedTemplateExpression(node, currentAncestors) {
            if (node.tag.name !== tag) return;

            // stack is maintained by acorn, make a copy
            // but don't include this node
            const ancestors = currentAncestors.slice(0, -1);
            // remove _this_ node from the stack

            templates.push({
                node,
                ancestors 
            });
        }
    }, noNestedTTE);

    return templates;
}
