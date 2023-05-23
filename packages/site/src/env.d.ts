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

import type { Session as AuthSession } from '@lil-indigestion-cards/core/types';

declare type Session = AuthSession;

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

export { Session };
