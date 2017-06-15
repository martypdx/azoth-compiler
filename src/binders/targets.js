
const childNode = (name, html) => ({
    import: name,
    html,
    init(binder) {
        return `${this.import}(${binder.index})`;
    }
});

export const text = childNode('__textBinder', '<text-node></text-node>');
export const block = childNode('__blockBinder', '<block-node></block-node>');
export const attribute = {
    import: '__attrBinder',
    html: '""',
    init(binder) {
        return `${this.import}('${binder.name}')`;
    }
};