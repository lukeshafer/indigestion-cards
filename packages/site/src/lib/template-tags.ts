export function html(...args: Parameters<typeof String.raw>) {
	return {
		response(props?: { status?: number; headers?: Record<string, string> }) {
			const htmlString = String.raw(...args);

			return new Response(htmlString, {
				status: props?.status ?? 200,
				headers: {
					'content-type': 'text/html; charset=utf-8',
					...props?.headers,
				},
			});
		},
	};
}
