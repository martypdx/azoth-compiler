import { parse } from 'acorn';

const options = {
	ecmaVersion: 7,
	preserveParens: true,
	sourceType: 'module'
};

export default function ast(source) {
	return parse(source, options);
}
