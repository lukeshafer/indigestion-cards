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
	setActivePack: () => { },
	removeNewStampStamp: () => { },
	setNextPack: () => { },
	cardScale: 1,
	setCardScale: () => { },
	previewedCardId: null,
	setPreviewedCardId: () => { },
	flipCard: () => { },
	getIsOnline: () => false,
	listHeight: 0,
	listHeightString: '0px',
	setListHeight: () => { },
	movePackToIndex: () => { },
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
	setNextPack(): void;

	cardScale: number;
	setCardScale(scale: number): void;

	previewedCardId: string | null;
	setPreviewedCardId(id: string): void;

	flipCard(instanceId: string): void;

	getIsOnline(username?: string): boolean;

	listHeight: number;
	listHeightString: string;
	setListHeight(height: number): void;

	movePackToIndex(fromIndex: number, toIndex: number): void;
};
