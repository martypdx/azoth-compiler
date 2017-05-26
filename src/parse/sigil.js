const types = {
    '*': 'observer',
    '@': 'observable'
};

const escapedMatch = /\\[#*@]$/;
const binderMatch = /[\*@]$/;
const blockMatch = /#$/;

export default function sigil(text) {

    const tryEscaped = () => {
        let escaped = false;
        text = text.replace(escapedMatch, m => {
            escaped = true;
            return m[m.length - 1];
        });
        return escaped;
    };

    const tryBlock = () => {
        if (blockMatch.test(text)) {
            text = text.slice(0, -1);
            return true;
        }
        return false;
    };

    const tryBinder = () => {
        let type = 'value';
        text = text.replace(binderMatch, m => {
            type = types[m];
            return '';
        });
        return type;
    };

    if (tryEscaped()) return {
        block: false,
        type: 'value',
        text
    };

    const block = tryBlock();
    if (block && tryEscaped()) return {
        block,
        type: 'value',
        text
    };

    const type = tryBinder();    
    return {
        block,
        type,
        text
    };
}
