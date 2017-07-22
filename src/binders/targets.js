const childNode = (name, html, isBlock = false, isComponent = false) => ({
    isBlock,
    isComponent,
    html,
    init({ index }) {
        return {
            name: name,
            arg: index
        };
    }
});

export const text = childNode('__textBinder', '<text-node></text-node>');
export const block = childNode('__blockBinder', '<!-- block -->', true);
export const component = childNode('__componentBinder', '<!-- component -->', true, true);

export const attribute = {
    isBlock: false,
    isComponent: false,
    html: '""',
    init({ name }) {
        return { 
            name: '__attrBinder',
            arg: name
        };
    }
};