const childNode = (binder, html, isBlock = false) => ({
    isBlock,
    isComponent: false,
    html,
    childIndex: true,
    name: binder,
    indexAdjustment: 0,
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
    childIndex: true,
    indexAdjustment: 1,
    name: '',
    init({ index }) {
        return {
            name: '',
            arg: index + 1
        };
    }
};


const attr = binder => ({
    isBlock: false,
    isComponent: false,
    html: '""',
    childIndex: false,
    indexAdjustment: 0,
    name: binder,
    init({ name }) {
        return { 
            name: binder,
            arg: name
        };
    }
});

export const attribute = attr('__attrBinder');
export const property = attr('__propBinder');