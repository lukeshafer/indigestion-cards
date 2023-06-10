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

import { ApiHandler, useHeader } from 'sst/node/api';
type HandlerCallback = Parameters<typeof ApiHandler>[0];
type HtmlApiResponse = (...args: Parameters<typeof String.raw>) => string
function HTMLApiHandler(handler: (args: {
	html: typeof html;

})) {
	return ApiHandler(async (event, ctx) => {
		const html = (...args: Parameters<typeof String.raw>) => {
			const htmlString = String.raw(...args);

			useHeader
		}

		const response = await handler({

		});



		return response;
	});
}
