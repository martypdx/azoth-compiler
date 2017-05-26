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
        return !this.type === 'value';
    }

    writeBinding(bIndex) { 
        const { ast, params, type } = this;

        let observable = '';
        
        if (type === 'observable') {
            observable = `(${astring(ast)})`;
        }
        else {
            observable = params.join();
                
            if(ast.type !== 'Identifier') {
                const expr = astring(ast);
                const map = `(${observable}) => (${expr})`;
                if (params.length > 1) {
                    observable = `combineLatest(${observable}, ${map})`;
                }
                else {
                    observable += `.map(${map})`;
                }
            }

            if(type === 'value') observable += `.first()`;
        }

        return this.addSubscribe(observable, bIndex);
    }

    addSubscribe(observable, bIndex) {
        return `${observable}.subscribe(__bind${bIndex}(__nodes[${this.elIndex}]));`;
    }

    // [sub templates]

    // [expressionObserver]
    
    // value bind ||
    // observer ||
    // observerable
}