/**
 * Tailwind helper to generate a class string based on the value of a
 * data attribute.
 *
 * @param themeDefinitions
 *  An object where keys are the theme name and their values are the
 *  corresponding theme utility classes.
 *
 * @param dataAttribute
 *  The data attribute used for themes. Defaults to 'theme',
 *  i.e. `data-theme`
 *
 * @returns className as branded string. Contains Typescript metadata
 *          to extract the theme names, if needed.
 *
 * @example
 *  Basic usage example
 *  ```js
 *    // If data-theme='red' on the applied element, this will set a red background.
 *    const className = createTailwindThemes({
 *      red: 'bg-red-400',
 *      green: 'bg-green-400',
 *    })
 *  ```
 *
 *  ```html
 *    // in your template...
 *    <button class={className} data-theme="red">I'm red</button>
 *    <button class={className} data-theme="green">I'm green</button>
 *  ```
 */
export function createTailwindThemes<ThemeDefinition extends Record<string, string>>(
	themeDefinitions: ThemeDefinition,
	dataAttribute = 'theme'
) {
	return Object.entries(themeDefinitions).reduce(
		(acc, [themeName, themeClass]) =>
			`${acc} ${themeClass
				.split(' ')
				.map((cls) => `data-[${dataAttribute}=${themeName}]:${cls}`)
				.join(' ')}`,
		''
	) as ThemeClass<keyof ThemeDefinition>;
}

type ThemeClass<ThemeName extends string | number | symbol> = string & {
	__themeName: ThemeName;
};

/**
 * Helper class to extract the theme names from output of createTailwindThemes
 *
 * @example
 *  ```typescript
 *  const className = createTailwindThemes({
 *    success: "...",
 *    error: "...",
 *  })
 *
 *  type Theme = ThemeName<typeof className> // "success" | "error"
 *  ```
 */
export type ThemeName<T extends ThemeClass<string>> = T['__themeName'];
