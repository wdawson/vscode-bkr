const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
    // Global ignores - should be in its own configuration object
    {
        ignores: ['out/**', 'dist/**', '**/*.d.ts', '.vscode/**', 'node_modules/**'],
    },
    // TypeScript files configuration
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest', // Use latest ECMAScript features (Node.js 24 supports ES2023)
                sourceType: 'module',
                project: './tsconfig.json', // Enable type-aware linting
            },
            globals: {
                // Node.js globals
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                exports: 'writable',
                module: 'writable',
                require: 'readonly',
                global: 'readonly',
                // ES2021 globals
                Promise: 'readonly',
                Map: 'readonly',
                Set: 'readonly',
                Symbol: 'readonly',
                WeakMap: 'readonly',
                WeakSet: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': typescriptEslint,
        },
        rules: {
            // TypeScript specific rules
            '@typescript-eslint/naming-convention': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],

            // General JavaScript rules
            'curly': 'warn',
            'eqeqeq': ['warn', 'always'],
            'no-throw-literal': 'warn',
            'prefer-const': 'warn',
            'no-var': 'error',
        },
    },
    // Test files configuration
    {
        files: ['**/*.test.ts', '**/test/**/*.ts'],
        rules: {
            // Relax some rules for test files
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },
];