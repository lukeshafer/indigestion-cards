export default {
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	ignorePatterns: ['dist/', 'node_modules/'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:solid/typescript',
		'plugin:astro/recommended',
		'plugin:astro/jsx-a11y-recommended',
	],
	overrides: [
		{
			files: ['.eslintrc.{js,cjs}'],
			env: {
				node: true,
			},
			parserOptions: {
				sourceType: 'script',
			},
		},
		{
			files: ['*.astro'],
			processor: 'astro/client-side-ts',
			parser: 'astro-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser',
				extraFileExtensions: ['.astro'],
			},
		},
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint', 'solid'],
	rules: {
		'prefer-const': 'off',
		'no-mixed-spaces-and-tabs': 'off',
		'solid/style-prop': 'off',
		'solid/self-closing-comp': 'off',
		'no-mixed-spaces-and-tabs': 'off',
		'@typescript-eslint/triple-slash-reference': 'off',
		'@typescript-eslint/no-namespace': 'off',
	},
};
