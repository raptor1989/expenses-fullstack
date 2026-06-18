const js = require('@eslint/js');
const globals = require('globals');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
    { ignores: ['dist'] },
    js.configs.recommended,
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'commonjs',
            parser: tsParser,
            globals: { ...globals.node, ...globals.jest }
        },
        plugins: {
            '@typescript-eslint': tsPlugin
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            'no-undef': 'off',
            'no-redeclare': ['error', { builtinGlobals: false }],
            '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
        }
    }
];
