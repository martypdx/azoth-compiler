import astring from 'astring';

export default class Binder {

    constructor({ type = 'value', ast = null } = {}, writer) {        
        this.type = type;
        this.params = null;
        this.ast = ast;
        this.elIndex = -1;
        this.templates = null;
        
        // this.index = -1;
        // this.expr = '';

        this.writer = writer;
        
    }

    writeHtml() {
        return this.writer.html;
    }

    writeInit() {
        return this.writer.init(this);
    }

    writeImport() {
        return { name: this.writer.import };
    }

    get isSubscriber() {
        return this.params.length > 0;
    }

    writeBinding(bIndex) { 
        const { ast, params, type } = this;
        const isIdentifier = ast.type === 'Identifier';

        const expr = isIdentifier ? ast.name : astring(ast);

        if (!params.length) {
            return `${this.writeBind(bIndex)}(${expr})`;
        }

        let observable = '';

        if(isIdentifier) {
            observable = expr;
        }
        else {
            if (type === 'observable') {
                observable = `(${expr})`;
            }
            else {
                observable = params.join();
                const map = `(${observable}) => (${expr})`;

                if (params.length > 1) {
                    observable = `combineLatest(${observable}, ${map})`;
                }
                else {
                    observable += `.map(${map})`;
                }
            }
        }

        if(type === 'value') observable += `.first()`;
        
        return this.addSubscribe(observable, bIndex);
    }

    addSubscribe(observable, bIndex) {
        return `${observable}.subscribe(${this.writeBind(bIndex)})`;
    }

    writeBind(bIndex) {
        return `__bind${bIndex}(__nodes[${this.elIndex}])`;
    }

    // [sub templates]

    // unsubscribe?
}