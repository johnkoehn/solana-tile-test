module.exports = {
    root: true,
    env: {
        browser: true,
        commonjs: true,
        es6: true
    },
    extends: ['airbnb', 'airbnb/hooks', 'airbnb-typescript'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
    },
    parserOptions: {
        ecmaVersion: 2021
    },
    rules: {
        indent: [2, 4],
        'arrow-parens': ['error', 'always'],
        'comma-dangle': 'off',
        'max-len': ['error', { code: 250 }],
        'object-curly-newline': ['error', { consistent: true }],
        'operator-linebreak': ['error', 'after'],
        'no-console': 'off',
        'prefer-destructuring': 'off',
        'global-require': 0,
        'arrow-body-style': 0,
        'react/jsx-filename-extension': 0,
        'react/jsx-indent': [2, 4],
        'react/jsx-indent-props': [2, 4],
        'react-hooks/exhaustive-deps': 0,
        'indent': [2, 4],
        '@typescript-eslint/indent': [2, 4],
        radix: 0,
        'react/prop-types': 0,
        'linebreak-style': 0,
        'react/no-array-index-key': 0,
        '@typescript-eslint/comma-dangle': ['error', 'never'],
        'react/destructuring-assignment': 0
    },
    ignorePatterns: ['.eslintrc.js'],
    parserOptions: {
        project: './tsconfig.eslint.json'
    }
};