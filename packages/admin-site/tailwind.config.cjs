const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			fontFamily: {
				display: ['var(--font-display)', ...fontFamily.sans],
				heading: ['var(--font-heading)', ...fontFamily.sans],
			},
			colors: {
				brand: {
					main: '#fd94e6',
					secondary: '#f66efa',
					tertiary: '#EF6DD9',
					dark: '#a23791',
					light: '#f9b7f7',
				},
				accent: {
					main: '#31FFD6',
					secondary: '#1fdeb8',
					tertiary: '#08fccc',
					dark: '#1eb395',
					light: '#8afff8',
				},
			},
		},
	},
	plugins: [],
}
