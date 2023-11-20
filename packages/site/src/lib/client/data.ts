interface Path {
	users: typeof import('../../pages/data/users');
	usernames: typeof import('../../pages/data/usernames');
}

type PathResponse<PathName extends keyof Path> = Awaited<ReturnType<Path[PathName]['GET']>>;

type PathData<PathName extends keyof Path> = PathResponse<PathName>['data'];

export async function get<PathName extends keyof Path>(
	path: PathName
): Promise<PathData<PathName>> {
	const res = await fetch(`/data/${path}`);
	if (!res.ok) {
		console.error(res);
		throw new Error('Res not okay');
	}

	return res.json();
}
