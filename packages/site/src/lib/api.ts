//import type { AstroGlobal } from 'astro';

export class TypedResponse<T> extends Response {
	data: T;

	constructor(body: T, opts?: ResponseInit) {
		super(JSON.stringify(body), {
			headers: {
				'content-type': 'application/json',
				...opts?.headers,
			},
			...opts,
		});
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

type CacheControlOptions = {
	public?: boolean;
	maxAge?: number;
	staleWhileRevalidate?: number;
};
export function cacheControl(opts: CacheControlOptions) {
	const result = [opts.public ? 'public' : 'private'];

	if (opts.maxAge !== undefined) result.push(`max-age=${opts.maxAge}`);
	if (opts.staleWhileRevalidate !== undefined)
		result.push(`stale-while-revalidate=${opts.staleWhileRevalidate}`);

	return result.join(', ');
}

//export function cachePage(
//ctx: AstroGlobal,
//opts: CacheControlOptions = {
//public: false,
//maxAge: 60,
//staleWhileRevalidate: time({ minutes: 10 }),
//}
//) {
//ctx.response.headers.set('cache-control', cacheControl(opts));
//}
