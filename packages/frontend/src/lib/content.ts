export function markdown(f: TemplateStringsArray, ...strings: unknown[]) {
	return String.raw(f, ...strings);
}
