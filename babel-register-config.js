const node_modules = /node_modules/;
const acorn = /node_modules\/acorn\/dist/;

require('babel-register')({
    // This will override `node_modules` ignoring - you can alternatively pass
    // an array of strings to be explicitly matched or a regex / glob
    ignore(filename) {
        return (node_modules.test(filename) && !acorn.test(filename));
    },
});