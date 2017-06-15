import undeclared from 'undeclared';

export default function getObservables(ast, identifiers) {
    return Array
        .from(undeclared(ast).values())
        .filter(name => false /*identifiers.has(name)*/);
}