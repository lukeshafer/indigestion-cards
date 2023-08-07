const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
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
			colors: {
				brand: {
					main: '#EF6EDA',
					secondary: '#f66efa',
					tertiary: '#EF6DD9',
					dark: '#bc40a0',
					light: '#f9b7eb',
					100: '#FFE0F9',
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
	plugins: [require('@tailwindcss/typography')],
};
