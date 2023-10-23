export type Session = UserSession | AdminSession | PublicSession;

interface PublicSession {
	type: 'public';
	properties: {
		userId?: null | undefined;
		username?: null | undefined;
	};
}

interface UserSession {
	type: 'user';
	properties: {
		userId: string;
		username: string;
	};
}

interface AdminSession {
	type: 'admin';
	properties: {
		userId: string;
		username: string;
	};
}

export type DBResult<T> =
	| {
		success: true;
		data: T;
	}
	| {
		success: false;
		error: string;
	};
