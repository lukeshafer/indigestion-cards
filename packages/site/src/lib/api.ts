export function html(...args: Parameters<typeof String.raw>) {
	const htmlString = String.raw(...args);

	return new Response(htmlString, {
		headers: {
			'content-type': 'text/html;charset=UTF-8',
		},
	});
}
