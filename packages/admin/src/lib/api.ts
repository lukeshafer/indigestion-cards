export class TypedResponse<T> extends Response {
	data: T;

	constructor(body: T, opts?: ResponseInit) {
		super(JSON.stringify(body), opts);
		this.data = body;
	}
}

// export function time(opts: { days?: number; hours?: number; minutes?: number; seconds?: number }) {
// 	return (
// 		(opts.days ?? 0) * 86400 +
// 		(opts.hours ?? 0) * 3600 +
// 		(opts.minutes ?? 0) * 60 +
// 		(opts.seconds ?? 0)
// 	);
// }
