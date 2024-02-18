import { createSessionBuilder } from 'sst/node/future/auth';

export const sessions = createSessionBuilder<{
	user: {
		userId: string;
		username: string;
    version: number;
	};
	admin: {
		userId: string;
		username: string;
    version: number;
	};
}>();
