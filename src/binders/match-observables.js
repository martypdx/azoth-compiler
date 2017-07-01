import undeclared from 'undeclared';

export default function getObservables(ast, scope) {
    if(ast.type === 'Identifier') {
        return scope[ast.name] ? [ast.name] : [];
    }
    
    return Array
        .from(undeclared(ast).values())
        .filter(name => scope[name]);
}