import { resolveLocalPath } from '@site/constants';

interface Path {
	users: typeof import('../../pages/data/users');
	usernames: typeof import('../../pages/data/usernames');
	'pack-count': typeof import('../../pages/data/pack-count');
	'packs-remaining': typeof import('../../pages/data/packs-remaining');
}

interface ParamPath {
	trades: {
		params: [tradeId: string];
		output: typeof import('../../pages/data/trades/[tradeId]');
	};
	user: {
		params: [username: string];
		output: typeof import('../../pages/data/user/[username]');
	};
	'cards-by-rarity': {
		params: [username: string];
		output: typeof import('../../pages/data/cards-by-rarity/[username]');
	};
	'cards-by-card-name': {
		params: [username: string];
		output: typeof import('../../pages/data/cards-by-card-name/[username]');
	};
}

type NoParamPathResponse<PathName extends keyof Path> = Awaited<ReturnType<Path[PathName]['GET']>>;
type ParamPathResponse<PathName extends keyof ParamPath> = Awaited<
	ReturnType<ParamPath[PathName]['output']['GET']>
>;

type NoParamPathData<PathName extends keyof Path> = NoParamPathResponse<PathName>['data'];
type ParamPathData<PathName extends keyof ParamPath> = ParamPathResponse<PathName>['data'];
type PathData<PathName extends PathKey> = PathName extends keyof Path
	? NoParamPathData<PathName>
	: PathName extends keyof ParamPath
		? ParamPathData<PathName>
		: never;

type PathKey = keyof Path | keyof ParamPath;

type Params<PathName extends PathKey> = PathName extends keyof ParamPath
	? ParamPath[PathName]['params']
	: undefined;

export async function get<PathName extends keyof Path>(path: PathName): Promise<PathData<PathName>>;
export async function get<PathName extends keyof ParamPath>(
	path: PathName,
	params: Params<PathName>,
	searchParams?: Record<string, string>
): Promise<PathData<PathName>>;
export async function get<PathName extends PathKey>(
	path: PathName,
	params?: Params<PathName>,
	searchParams?: Record<string, string>
): Promise<PathData<PathName>> {
	console.log('get', { path, params });
	const pathParams = params ? `/${params.join('/')}` : '';
	let search = '';
	if (searchParams) {
		search = '?' + new URLSearchParams(searchParams).toString();
	}

	try {
		const res = await fetch(resolveLocalPath(`/data/${path}${pathParams}${search}`));

		if (!res.ok) {
			console.error(res);
			throw new Error('Get response error' + (await res.text()));
		}

		return res.json();
	} catch (error) {
		console.log('UH OH, an error just happened!!');
		console.error({ error });
		return Promise.reject('An error occurred while fetching path ' + path);
	}
}
