import { recursive } from 'acorn/dist/walk.es';
import { Module } from '../state/module';
import parse from '../ast';
import { generate } from 'astring';
import * as templates from './templates';
import * as observables from './observables';

export default function compile(source) {
    const ast = parse(source);
    astTransform(ast);
    return generate(ast);
}

const handlers = Object.assign({}, templates, observables);

export function astTransform(ast) {
    recursive(ast, new Module(), handlers);
}