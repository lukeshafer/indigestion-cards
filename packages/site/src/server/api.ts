import { collections } from './api/collections';
import { users } from './api/users';
import { userCards } from './api/user-cards';
import { designs } from './api/designs';
import { seasons } from './api/seasons';
import { designCards } from './api/design-cards';
import { packs } from './api/packs';
import { trades } from './api/trades';
import { router } from './router';

export const appRouter = router({
	users,
	userCards,
	designs,
	seasons,
	designCards,
	packs,
	collections,
	trades,
});

export type AppRouter = typeof appRouter;
