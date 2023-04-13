const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			fontFamily: {
				display: ['Rabbid Highway Sign II', ...fontFamily.sans],
				heading: ['Mont', ...fontFamily.sans],
			},
			colors: {
				brand: {
					main: '#fd94e6',
					secondary: '#f66efa',
				},
			},
		},
	},
	plugins: [],
}
