export type Session = UserSession | AdminSession | PublicSession;

export interface PublicSession {
	type: 'public';
	properties: {
		userId?: null | undefined;
		username?: null | undefined;
		version?: null | undefined;
	};
}

export interface UserSession {
	type: 'user';
	properties: {
		userId: string;
		username: string;
		version?: number;
	};
}

export interface AdminSession {
	type: 'admin';
	properties: {
		userId: string;
		username: string;
		version?: number;
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

export type LibraryOutput<T, E = unknown> =
	| { success: true; data: T; error?: undefined }
	| { success: false; error: E; data?: undefined };
