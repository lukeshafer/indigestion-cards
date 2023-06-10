export function html(...args: Parameters<typeof String.raw>) {
	const htmlString = String.raw(...args);

	return new HTMLResponse(htmlString);
}

class HTMLResponse extends Response {
	constructor(htmlString: string) {
		super(htmlString, {
			headers: {
				'content-type': 'text/html;charset=UTF-8',
			},
		});
	}

	response(props: ResponseInit) {
		return new Response(this.body, {
			...props,
			headers: {
				...props.headers,
				'content-type': 'text/html;charset=UTF-8',
			},
		});
	}
}
