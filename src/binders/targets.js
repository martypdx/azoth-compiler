const childNode = (name, html, isBlock) => ({
    isBlock,
    html,
    init({ index }) {
        return {
            name: name,
            arg: index
        };
    }
});

export const text = childNode('__textBinder', '<text-node></text-node>', false);
export const block = childNode('__blockBinder', '<!-- block -->', true);

export const attribute = {
    isBlock: false,
    html: '""',
    init({ name }) {
        return { 
            name: '__attrBinder',
            arg: name
        };
    }
};