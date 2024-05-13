/// <reference types="@solidjs/start/env" />

import { Session, SiteConfig } from '@core/types';

declare module '@solidjs/start/server' {
	interface RequestEventLocals {
		session: Session | null;
		siteConfig: SiteConfig;
	}
}
