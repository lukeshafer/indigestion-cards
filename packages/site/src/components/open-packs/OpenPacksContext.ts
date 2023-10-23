import { createContext } from 'solid-js';
/***/
import type { Pack } from '@lil-indigestion-cards/core/db/packs';
/***/

export const OpenPacksContext = createContext<OpenPacksState>({
	isTesting: undefined,
	isHidden: false,
	packs: [],
	activePack: null,
	packsRemaining: 0,
	setActivePack: () => {},
	removeNewStampStamp: () => {},
	removePack: () => {},
	setNextPack: () => {},
	cardScale: 1,
	setCardScale: () => {},
	previewedCardId: null,
	setPreviewedCardId: () => {},
	flipCard: () => {},
	draggingIndex: null,
	setDraggingIndex: () => {},
	hoveringIndex: null,
	setHoveringIndex: () => {},
	draggingY: null,
	getIsOnline: () => false,
	moveOnlineToTop: () => {},
	listHeight: 0,
	listHeightString: '0px',
	setListHeight: () => {},
});

export type PackEntityWithStatus = Pack & {
	cardDetails: Pack['cardDetails'] &
		{
			stamps?: string[];
		}[];
};

export type OpenPacksState = {
	isTesting: boolean | undefined;
	isHidden: boolean;

	packs: PackEntityWithStatus[];
	activePack: PackEntityWithStatus | null;
	packsRemaining: number;
	setActivePack(pack: PackEntityWithStatus): void;
	removeNewStampStamp(instanceId: string): void;
	removePack(): void;
	setNextPack(): void;

	cardScale: number;
	setCardScale(scale: number): void;

	previewedCardId: string | null;
	setPreviewedCardId(id: string): void;

	flipCard(instanceId: string): void;

	draggingIndex: number | null;
	setDraggingIndex(index: number | null): void;

	hoveringIndex: number | null;
	setHoveringIndex(index: number | null): void;

	draggingY: number | null;
	getIsOnline(username?: string): boolean;
	moveOnlineToTop(): void;

	listHeight: number;
	listHeightString: string;
	setListHeight(height: number): void;
};
