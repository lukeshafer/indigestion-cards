import type { CardDesign, CardInstance } from "../db.types";

export interface RarityStats {
	rarityId: string;
	rarityName: string;
	received: number;
	unopened: number;
	opened: number;
	notGivenOut: number;
	total: number;
	instances: Array<CardInstance | null>;
}

export function getRarityStatsOverviewFromDesignAndInstances(
	design: CardDesign,
	cardInstances: Array<CardInstance>
) {
	const rarityStats = {} as Record<string, RarityStats>;
	design.rarityDetails?.forEach((rarity) => {
		rarityStats[rarity.rarityId] = {
			rarityId: rarity.rarityId,
			rarityName: rarity.rarityName,
			received: 0,
			unopened: 0,
			opened: 0,
			notGivenOut: rarity.count,
			total: rarity.count,
			instances: new Array<CardInstance | null>(rarity.count).fill(null),
		};
	});

	cardInstances.forEach((instance) => {
		const rarityId = instance.rarityId;
		const rarity = rarityStats[rarityId];
		if (!rarity) return;

		rarity.received += 1;
		rarity.unopened += instance.openedAt ? 0 : 1;
		rarity.opened += instance.openedAt ? 1 : 0;
		rarity.notGivenOut -= 1;
		rarity.instances[instance.cardNumber - 1] = instance;
	});

	return Object.values(rarityStats);
}
