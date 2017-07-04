
const childNode = (name, html) => ({
    html,
    init(binder) {
        return {
            name: name,
            arg: binder.index
        };
    }
});

export const text = childNode('__textBinder', '<text-node></text-node>');
export const block = childNode('__blockBinder', '<block-node></block-node>');

export const attribute = {
    html: '""',
    init(binder) {
        return { 
            name: '__attrBinder',
            arg: binder.name
        };
    }
};