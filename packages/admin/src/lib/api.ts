export class TypedResponse<T> extends Response {
	data: T;

	constructor(body: T, opts?: ResponseInit) {
		super(JSON.stringify(body), opts);
		this.data = body;
	}
}

export function time(opts: { days?: number; hours?: number; minutes?: number; seconds?: number }) {
	return (
		(opts.days ?? 0) * 86400 +
		(opts.hours ?? 0) * 3600 +
		(opts.minutes ?? 0) * 60 +
		(opts.seconds ?? 0)
	);
}

//export function cacheControl(opts: {
	//public?: boolean;
	//maxAge?: number;
	//staleWhileRevalidate?: number;
//}) {
	//const result = [opts.public ? 'public' : 'private'];

	//if (opts.maxAge) result.push(`max-age=${opts.maxAge}`);
	//if (opts.staleWhileRevalidate)
		//result.push(`stale-while-revalidate=${opts.staleWhileRevalidate}`);

	//return result.join(', ');
//}
