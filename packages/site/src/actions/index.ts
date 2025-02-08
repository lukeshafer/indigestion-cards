import { createCollection } from './collections';
import { setIsLocked } from './packs';

export const server = {
	packs: { setIsLocked },
	collections: { createCollection },
};
