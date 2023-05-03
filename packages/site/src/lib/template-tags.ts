export function css(...args: Parameters<typeof String.raw>) {
	const cssString = String.raw(...args);
	const styles = new CSSStyleSheet();

	styles.replaceSync(cssString);
	return styles;
}

export function html(...args: Parameters<typeof String.raw>) {
	return {
		response(props?: { status?: number; headers?: Record<string, string> }) {
			const htmlString = String.raw(...args);

			return {
				status: props?.status ?? 200,
				headers: {
					'content-type': 'text/html; charset=utf-8',
					...props?.headers,
				},
				body: htmlString,
			};
		},
	};
}
