//@ts-check
import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';
import solid from 'eslint-plugin-solid/configs/typescript';
import astro from 'eslint-plugin-astro';
//import jsxA11y from 'eslint-plugin-jsx-a11y'

export default ts.config(
  js.configs.recommended,
  //jsxA11y.flatConfigs.recommended,
  solid,
  ...ts.configs.recommended,
  ...astro.configs['flat/jsx-a11y-recommended'],
  ...astro.configs['flat/recommended'],
  {
    ignores: ['**/dist/', '**/node_modules/'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    rules: {
      'prefer-const': 'off',
      'no-mixed-spaces-and-tabs': 'off',
      'solid/style-prop': 'off',
      'solid/self-closing-comp': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-namespace': 'off',
    },
  },
);
