/* eslint-disable */
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
declare global {
	namespace App {
		interface Locals {
			session: Session | null;
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

interface AdminSession {
	type: 'admin';
	properties: {
		userId: string;
		username: string;
	};
}

export { Session };

declare module 'solid-js' {
	namespace JSX {
		interface Directives {
			clickOutside: any
			searchDirective: any
			showPreview: any
		}
	}
}
