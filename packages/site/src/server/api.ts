import { router } from './router';

import { collections } from './api/collections';
import { users } from './api/users';
import { userCards } from './api/user-cards';
import { designs } from './api/designs';
import { seasons } from './api/seasons';
import { designCards } from './api/design-cards';
import { packs } from './api/packs';
import { trades } from './api/trades';
import { statistics } from './api/statistics';
import { twitch } from './api/twitch';

export const appRouter = router({
	users,
	userCards,
	designs,
	seasons,
	designCards,
	packs,
	collections,
	trades,
	statistics,
	twitch,
});

export type AppRouter = typeof appRouter;
