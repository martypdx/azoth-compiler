import { parse } from '../../src/ast';

Function.prototype.toCode = function() {
    const trimmed = this.toString().trim();
    const length = trimmed.length;

    const tryBlockArrow = trimmed.replace(/^\(\) => {/, '');
    if(tryBlockArrow.length !== length) {
        return tryBlockArrow
            .slice(0,-1)
            .trim();
    }

    const tryArrow = trimmed.replace(/^\(\) => /, '');
    if(tryArrow.length !== length) {
        return tryArrow.trim();
    }

    return trimmed
        .replace(`function ${this.name}() {`, '')
        .slice(0,-1)
        .trim();
};

Function.prototype.toAst = function() {
    return parse(this.toCode());
};

Function.prototype.toExpr = function () {
    return this.toAst().body[0].expression; 
};

