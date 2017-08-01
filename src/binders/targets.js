const childNode = (binder, html, isBlock = false) => ({
    isBlock,
    isComponent: false,
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

export const component = {
    isBlock: true,
    isComponent: true,
    html: '<#: ',
    init({ index }) {
        return {
            name: '__componentBinder',
            arg: index + 1
        };
    }
};


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