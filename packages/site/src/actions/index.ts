import { createCollection, deleteCollectionAction } from './collections';
import { setIsLocked } from './packs';

export const server = {
	packs: { setIsLocked },
	collections: { createCollection, deleteCollection: deleteCollectionAction },
};
