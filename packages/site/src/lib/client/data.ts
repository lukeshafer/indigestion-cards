interface Path {
	users: typeof import('../../pages/data/users');
	usernames: typeof import('../../pages/data/usernames');
  "pack-count": typeof import('../../pages/data/pack-count');
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
	params: Params<PathName>
): Promise<PathData<PathName>>;
export async function get<PathName extends PathKey>(
	path: PathName,
	params?: Params<PathName>
): Promise<PathData<PathName>> {
	const pathParams = params ? `/${params.join('/')}` : '';
	const res = await fetch(`/data/${path}${pathParams}`);
	if (!res.ok) {
		console.error(res);
		throw new Error('Res not okay');
	}

	return res.json();
}
