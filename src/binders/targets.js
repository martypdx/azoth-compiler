const childNode = (binder, html, isBlock = false, isComponent = false) => ({
    isBlock,
    isComponent,
    html,
    init({ index }) {
        return {
            name: binder,
            arg: index
        };
    }
});

export const text = childNode('__textBinder', '<text-node></text-node>');
export const block = childNode('__blockBinder', '<!-- block -->', true);
export const component = childNode('__componentBinder', '<#: ', true, true);

const attr = binder => ({
    isBlock: false,
    isComponent: false,
    html: '""',
    init({ name }) {
        return { 
            name: binder,
            arg: name
        };
    }
});

export const attribute = attr('__attrBinder');
export const property = attr('__propBinder');