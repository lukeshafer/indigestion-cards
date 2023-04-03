// @ts-check
import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import aws from 'astro-sst/lambda'

import solidJs from '@astrojs/solid-js'

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: aws(),
	integrations: [tailwind(), solidJs()],
})
