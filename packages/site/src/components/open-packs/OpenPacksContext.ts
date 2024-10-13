import { createContext } from 'solid-js';
/***/
import type { Pack } from '@core/types';
/***/

export const OpenPacksContext = createContext<OpenPacksState>({
	isTesting: undefined,
	isHidden: false,
  adminSecret: '',
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
  refreshPacks: () => { },
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
  adminSecret: string;

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
  refreshPacks(): void;
};
