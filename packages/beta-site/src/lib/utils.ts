import { ASSETS } from "~/config";
import type { CardDesign, SiteConfig } from "@core-types/db";
import { LEGACY_CARD_ID } from "@lib/constants";

export const useViewTransition = (cb: () => unknown) =>
	// @ts-expect-error - startViewTransition is not on Document yet
	document.startViewTransition ? document.startViewTransition(cb) : cb();

export function markdown(f: TemplateStringsArray, ...strings: unknown[]) {
	return String.raw(f, ...strings);
}

export function getBaseRarity(design: CardDesign, siteConfig?: SiteConfig) {
	return design.bestRarityFound ||
	design.rarityDetails?.find((r) => r.rarityId === LEGACY_CARD_ID) ||
	siteConfig?.baseRarity || {
		rarityId: 'default',
		rarityName: 'Default',
		frameUrl: ASSETS.CARDS.DEFAULT_BASE_RARITY,
		rarityColor: '#fff',
	};
}
