const { fontFamily } = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
	plugins: [require('@tailwindcss/typography'), require('@tailwindcss/container-queries')],
	//darkMode: 'class', // TODO: uncomment when implementing dark mode toggle
	theme: {
		colors: {
			gray: colors.gray,
			brand: {
				50: '#fef5fc',
				100: '#fee9fd',
				200: '#fbd3f7',
				300: '#f7b0ed',
				400: '#ef6eda',
				500: '#e550cd',
				600: '#c831ab',
				700: '#a6258b',
				800: '#882071',
				900: '#6f205c',
				950: '#490939',
			},
			accent: {
				50: '#eefffa',
				100: '#c5fff3',
				200: '#8bffe8',
				300: '#31ffd6',
				400: '#14edc9',
				500: '#00d1b0',
				600: '#00a892',
				700: '#008575',
				800: '#056a5f',
				900: '#0a574f',
				950: '#003532',
			},
		},
		extend: {
			spacing: {
				main: 'var(--spacing-main)',
			},
			maxWidth: {
				main: 'var(--spacing-main)',
			},
			fontFamily: {
				display: ['var(--font-display)', ...fontFamily.sans],
				heading: ['var(--font-heading)', ...fontFamily.sans],
			},
			animation: {
				stamp: 'stamp 500ms cubic-bezier(0.44, 1.34, 0.37, 0.99) forwards',
			},
		},
	},
};
