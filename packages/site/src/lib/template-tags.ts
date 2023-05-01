export function css(...args: Parameters<typeof String.raw>) {
	const cssString = String.raw(...args);
	const styles = new CSSStyleSheet();

	styles.replaceSync(cssString);
	return styles;
}
