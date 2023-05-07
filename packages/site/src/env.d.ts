/// <reference types="astro/client" />
declare global {
	namespace App {
		interface Locals {
			session: Session | null;
			admin: AdminSession | null;
			user: UserSession | AdminSession | null;
		}
	}
}

declare type Session = UserSession | AdminSession | PublicSession;

interface PublicSession {
	type: 'public';
	properties: {};
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

export { };
