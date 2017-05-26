

function init(binder) {
    return `${this.binder}(${binder.index})`;
}

export const text = {
    binder: '__textBinder',
    html: '<text-node></text-node>',
    init
};

export const block = {
    binder: '__blockBinder',
    html: '<block-node></block-node>',
    init
};

export const attribute = {
    binder: '__attrBinder',
    html: '""',
    init(binder) {
        return `${this.binder}('${binder.name}')`;
    }
};