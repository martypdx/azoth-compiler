import findImport from './find-import';
import findTemplates from './parse/find-templates';
import MagicString from 'magic-string';
// import astring from 'astring';
import parse from './ast';

export default function compileAll(source) {
    return new Module(source).code;
}

const bindingImport = {
    'text-node': 'tb',
    'block': 'bb'
};

class Bindings {
    constructor() {
        this.imports = new Set();
        this.binders = [];
    }

    add(binding) {
        this.imports.add(bindingImport[binding.type]);
        return (this.binders.push(binding) - 1);
    }
}

class Module {
    constructor(source) {
        const s = this.source = new MagicString(source);
        const ast = parse(source);

        const specifier = findImport(ast);
        const tag = specifier ? specifier.local.name : '$';
        const templates = findTemplates(ast, tag);

        const { imports, binders } = this.bindings = new Bindings();
        const fragments = this.fragments = [];

        templates.forEach(this.compile.bind(this));

        if (specifier) {
            const importsToAdd = ['renderer', 'makeFragment', ...Array.from(imports).map(imp => `__${imp}`)];
            s.overwrite(specifier.start, specifier.end, importsToAdd.join());
        }
        
        const renderers = fragments.map((html, i) => 
            `const render_${i} = renderer(makeFragment(\`${html}\`));`
        );
        const bindingDeclarations =  binders.map((b, i) =>
            `const __bind${i} = __${bindingImport[b.type]}(${b.index});`
        );
        const toPrepend = renderers.join('\n') + '\n' + bindingDeclarations.join('\n') + '\n' ;

        s.prepend(toPrepend);
    }

    get code() {
        return this.source.toString();
    }

    addGlobals(html, bindings) {
        const index = this.fragments.push(html) - 1;
        bindings.forEach(b => b.declaredIndex = this.bindings.add(b));
        return index;
    }

    generateCode({ html, bindings, scope = { plucks: [], params: [] } }) {
        const i = this.addGlobals(html, bindings);
        const bind = this.bind.bind(this);
        const { plucks, params } = scope;

        return `(${Object.keys(params)}) => {
            const __nodes = render_${i}();
            ${plucks && plucks.length ? '\n' + plucks.map(pluck).join('\n') : ''}
            
            ${bindings.map(bind).join('\n')}
            
            const __fragment = __nodes[__nodes.length];
            __fragment.unsubscribe = () => {
                ${bindings.map(unsubscribe).join('')}
            };
            return __fragment;
        }`;

        

    }

    bind(b, i) {
        let binding = '';
        if(b.type === 'block') {
            const templates = b.templates.map(t => this.generateCode(t));
            binding = templates.map((code, i) => {
                return `const t${i} = ${code};` + '\n';
            }).join('');
        }

        if (b.ref) binding += bindReference(b, i);
        else if (b.expr) binding += bindExpression(b, i);
        else if(b.type === 'block') {
            binding += '\n';
            binding += bindToNodeWithValue(b, 't0');
        }
        else binding += bindToNode(b);

        return binding;	
    }

    compile(template) {
        const code = this.generateCode(template); 
        const codeGen = `(() => {
            return ${code};
        })()`;

        const { scope } = template;
        this.source.overwrite(scope.start, scope.end, codeGen);
    }
}

function bindReference(b, i) {
    return b.observable ? bindObservable(b, i) : bindStatic(b, i);
}

function bindObservable(b, i) {
    return `const __s${i} = ${b.ref}.subscribe(${bindToNode(b)});`;
}

function bindStatic(b, i) {
    return `${bindToNode(b)}(${b.ref}.value);`;
}

function bindToNodeWithValue(b, val) {
    return `${bindToNode(b)}(${val});`;
}

function bindToNode(b) {
    return `__bind${b.declaredIndex}(__nodes[${b.elIndex}])`;
}

function bindExpression(b, i) {
    if(b.observable) {
        b.ref = `__e${i}`;
        const expr = b.params.length === 1 ? singleParam(b) : multiParam(b);
        return expr + '\n' + bindObservable(b, i);
    }
    else {
        return bindToNodeWithValue(b, exprFn(b));
    }
}

function exprFn(b) {
    return `((${b.params.join()}) => (${b.expr}))(${b.params.map(p => `${p}.value`).join()})`;
}

function singleParam(b) {
    return `const ${b.ref} = ${b.params[0]}.map(${b.params[0]}=>(${b.expr}));`;
}

function multiParam(b) {
    return `const ${b.ref} = combineLatest(${b.params},(${b.params})=>(${b.expr}));`;
}

function unsubscribe(b, i) {
    const unsub = [];
    if (b.observable) {
        unsub.push(`__s${i}.unsubscribe();`);
        // if (b.expr) unsub.push(`__e${i}.unsubscribe();`);
    }
    return unsub.length ? unsub.join('\n') : '';
}

function pluck(pluck) {
    return `const ${pluck.key} = __ref${pluck.index}.pluck('${pluck.key}').distinctUntilChanged();`;
}
