// import astring from 'astring';

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

    // [sub templates]

    // [expressionObserver]
    
    // value bind ||
    // subscriber bind ||
    // observer bind
}