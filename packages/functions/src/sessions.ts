import { createSessionBuilder } from 'sst/node/future/auth';

export const sessions = createSessionBuilder<{
	user: {
		userId: string;
		username: string;
	};
	admin: {
		userId: string;
		username: string;
	};
}>();
