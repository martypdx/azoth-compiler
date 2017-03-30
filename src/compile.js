import findImport from './findImport';
import findTemplates from './findTemplates';
import MagicString from 'magic-string';
// import astring from 'astring';
import parse from './ast';

export default function compileAll(source) {
    return new Module(source).code;
}


// export default function compileAll(source) {
// 	const s = new MagicString(source);
// 	const ast = parse(source);

// 	const specifier = findImport(ast);
// 	const tag = specifier ? specifier.local.name : '$';
// 	const templates = findTemplates(ast, tag);

// 	const codes = new Set();
// 	const compile = compiler(s, codes);
// 	templates.map(compile);

// 	if (specifier) {
// 		const importsToAdd = ['renderer', 'makeFragment', ...Array.from(codes).map(imp => `__${imp}`)];
// 		s.overwrite(specifier.start, specifier.end, importsToAdd.join());
// 	}
    
// 	return s.toString();
// }


const bindingImport = {
    'orphan-text': 'otb',
    'child-text': 'ctb',
    'section': 'sb'
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
            `const render_${i} = renderer(makeFragment('${html}'));`
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

        //TODO: should expressions unsubscribe? (think so)
        return `(${Object.keys(params)}) => {
            const __nodes = render_${i}();
            ${plucks.length ? '\n' + plucks.map(pluck).join('\n') : ''}
            
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
        if(b.type === 'section') {
            binding = `const __section_${b.declaredIndex} = __bind${b.declaredIndex}(__nodes[${b.elIndex}], ${this.generateCode(b.template)});${'\n'}`;
            binding += `__section_${i}();`;
        }
        else if (b.ref) binding = bindReference(b, i);
        else if (b.expr) binding = bindExpression(b, i);
        else throw new Error('Unexpected binding type');
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

class Template {
    constructor(){}
}

function compiler(s, codes) {

    return function compile(template) {
        const fragments = [];
        const initBindings = [];
        const addTemplate = (html, bindings) => {
            const index = fragments.push(html) - 1;
            initBindings.push(bindings);
            // for top-level import:
            bindings.forEach(b => codes.add(bindingImport[b.type]));
            return index;
        }


        const code = writeCode(template); 
        
        const renders = fragments.map((html, i) => 
            `const render_${i} = renderer(makeFragment(\`${html}\`));`
        );

        const declareBindings = initBindings.map(bindings => bindings.map(declareBinding).join('\n'));

        const codeGen = `(() => {
            ${renders.join('\n')}
            ${declareBindings.join('\n')}
            return ${code};
        })()`;

        const { scope } = template;
        s.overwrite(scope.start, scope.end, codeGen);

        function writeCode({ html, bindings, scope = { plucks: [], params: [] }, node }) {
            const i = addTemplate(html, bindings);
            const { plucks, params } = scope;

            //TODO: should expressions unsubscribe? (think so)
            return `(${Object.keys(params)}) => {
                const nodes = render_${i}();${plucks.length ? '\n' + plucks.map(pluck).join('\n') : ''}
                ${bindings.map(bind).join('\n')}
                const __fragment = nodes[nodes.length];
                __fragment.unsubscribe = () => {
                    ${bindings.map(unsubscribe).join('')}
                };
                return __fragment;
            }`;

        }

        function bind(b, i) {
            let binding = '';
            if(b.type === 'section') {
                binding = `const __section_${b.declaredIndex} = __${bindingImport[b.type]}${i}(__nodes[${b.elIndex}], ${writeCode(b.template)});${'\n'}`;
                binding += `__section_${i}();`;
            }
            else if (b.ref) binding = bindReference(b, i);
            else if (b.expr) binding = bindExpression(b, i);
            else throw new Error('Unexpected binding type');
            return binding;
        }

    }
}

function bindReference(b, i) {
    return b.observable ? bindObservable(b, i) : bindStatic(b, i);
}

function bindObservable(b, i) {
    return `const __s${i} = ${b.ref}.subscribe(__bind${b.declaredIndex}(__nodes[${b.elIndex}]));`
}

function bindStatic(b, i) {
    return `__bind${i}(__nodes[${b.elIndex}])(${b.ref}.value);`
}

function bindNone(b, i) {
    return `__bind${i}(__nodes[${b.elIndex}])();`
}

function bindExpression(b, i) {
    b.ref = `__e${i}`;
    const expr = `const ${b.ref} = combineLatest(${b.params},(${b.params})=>(${b.expr}));`
    return expr + '\n' + bindObservable(b, i);
}

function unsubscribe(b, i, arr) {
    let unsub = '';
    if (b.observable) unsub += `__s${i}.unsubscribe();`;
    if (b.type === 'section') unsub += `${unsub ? '\n' : ''}__section_${i}.unsubscribe();`;
    if (unsub && i !== arr.length - 1) unsub += '\n';
    return unsub;
}

function pluck(pluck) {
    return `const ${pluck.key} = __ref${pluck.index}.pluck('${pluck.key}').distinctUntilChanged();`;
}
