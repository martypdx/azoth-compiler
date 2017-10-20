import { recursive } from 'acorn/dist/walk.es';
import { Module } from '../state/module';
import { Imports } from '../state/imports';
import { parse, generate } from '../ast';
import * as templates from './templates';
import createHandler from './observables';
import createRefCounter from './ref-counter';

export default function compile(source) {
    const ast = parse(source);
    astTransform(ast);
    return generate(ast);
}

export function astTransform(ast) {
    const imports = new Imports(ast);
    const module = new Module(imports);
    const refCounter = createRefCounter();
    const observables = createHandler(refCounter, imports.observableTag);
    const handlers = Object.assign({}, templates, observables);

    recursive(ast, module, handlers);
}