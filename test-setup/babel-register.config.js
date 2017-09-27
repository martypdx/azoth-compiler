const node_modules = /node_modules/;
const acorn = /node_modules\/acorn\/dist/;

require('babel-register')({
    ignore(filename) {
        return (node_modules.test(filename) && !acorn.test(filename));
    },
});

require('./to-code');