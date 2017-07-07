const childNode = (name, html) => ({
    html,
    init({ index }) {
        return {
            name: name,
            arg: index
        };
    }
});

export const text = childNode('__textBinder', '<text-node></text-node>');
export const block = childNode('__blockBinder', '<block-node></block-node>');

export const attribute = {
    html: '""',
    init({ name }) {
        return { 
            name: '__attrBinder',
            arg: name
        };
    }
};