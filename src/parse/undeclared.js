// TODO: rewrite this using acron.
import estraverse from 'estraverse';

export default function recurse(ast, declared, undeclared) {
    var ast_fn, ast_fns, declared_copy, i, ids, len;
    if (declared == null) {
        declared = new Set();
    }
    if (undeclared == null) {
        undeclared = new Set();
    }
    ids = new Set();
    ast_fns = [];
    estraverse.traverse(ast, {
        enter: function(node, parent) {
            if (parent != null) {
                if (node.subtemplate) {
                    this.skip();
                }
                else if (node.type === 'Identifier') {
                    if (parent.type === 'VariableDeclarator') {
                        declared.add(node.name);
                    } else if (
                        !parent.key &&
                        (parent.type !== 'MemberExpression' ||
                            node.name !== parent.property.name)
                    ) {
                        ids.add(node.name);
                    }
                }
                else if (
                    node.type === 'FunctionDeclaration' ||
                    node.type === 'FunctionExpression' ||
                    node.type === 'ArrowFunctionExpression'
                ) {
                    ast_fns.push(node);
                    if (node.id != null) {
                        declared.add(node.id.name);
                    }
                    this.skip();
                }
            }
        }
    });
    ids.forEach(function(id) {
        if (!declared.has(id)) {
            undeclared.add(id);
        }
    });
    for ((i = 0), (len = ast_fns.length); i < len; i++) {
        ast_fn = ast_fns[i];
        declared_copy = new Set();
        declared.forEach(function(id) {
            declared_copy.add(id);
        });
        ast_fn.params.forEach(function(param) {
            declared_copy.add(param.name);
        });
        recurse(ast_fn, declared_copy, undeclared);
    }
    return undeclared;
}