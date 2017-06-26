import { recursive } from 'acorn/dist/walk.es';
import { Globals } from './globals';
import parse from '../ast';
import { generate } from 'astring';
import * as templates from './templates';

export default function compile(source) {
    const ast = parse(source);


    recursive(ast, new Globals(), templates);

    return generate(ast);
}