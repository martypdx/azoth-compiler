
const childNode = (binder, html) => ({
    binder,
    html,
    init(binder) {
        return `${this.binder}(${binder.index})`;
    }
});

export const text = childNode('__textBinder', '<text-node></text-node>');
export const block = childNode('__blockBinder', '<block-node></block-node>');
export const attribute = {
    binder: '__attrBinder',
    html: '""',
    init(binder) {
        return `${this.binder}('${binder.name}')`;
    }
};