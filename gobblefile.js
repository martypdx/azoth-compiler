/* globals require, module */
const gobble = require( 'gobble' );
module.exports = gobble( 'src' ).transform( 'babel' );