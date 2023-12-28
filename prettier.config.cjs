/** @type {import("prettier").Config} */
module.exports = {
	pluginSearchDirs: false,
	useTabs: true,
	overrides: [
		{
			files: '*.astro',
			options: {
				parser: 'astro',
			},
		},
	],
	singleQuote: true,
	trailingComma: 'es5',
	tabWidth: 4,
	useTabs: true,
	printWidth: 100,
	bracketSameLine: true,
	arrowParens: 'avoid',
	plugins: ['prettier-plugin-astro', 'prettier-plugin-tailwindcss'],
};
