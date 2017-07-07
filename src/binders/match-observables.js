import undeclared from 'undeclared';

export default function match(ast, scope) {
    if(ast.type === 'Identifier') {
        return scope[ast.name] ? [ast.name] : [];
    }

    const undeclareds = undeclared(ast).values();
    
    return Array
        .from(undeclareds)
        .filter(name => scope[name]);
}