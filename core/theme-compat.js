// Themes exported by the old standalone Lite extension used --tnl-* variables; read them as --tn-*.
export function toThemeVariables(variables = {}) {
    if (!variables || typeof variables !== 'object' || Array.isArray(variables)) return {};

    return Object.fromEntries(Object.entries(variables).flatMap(([key, value]) => {
        let name = '';
        if (key.startsWith('--tnl-')) name = key.replace(/^--tnl-/, '--tn-');
        else if (key.startsWith('--tn-')) name = key;
        else return [];

        const converted = typeof value === 'string'
            ? value.replace(/--tnl-/g, '--tn-')
            : value;
        return [[name, converted]];
    }));
}
