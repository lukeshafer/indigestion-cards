'use server';
import { ElectroError, Service } from 'electrodb';
import {
	type CardDesign,
	type CreateCardDesign,
	type UpdateCardDesign,
	cardDesigns,
} from '../db/cardDesigns';
import { getAllSeasons } from './season';
import { cardInstances } from '../db/cardInstances';
import { config } from '../db/_utils';
import type { DBResult } from '../types';
import { NO_CARDS_OPENED_ID } from './constants';

export async function getAllCardDesigns() {
	const seasons = await getAllSeasons();
	const results = await Promise.all(
		seasons.map((season) => cardDesigns.query.bySeasonId({ seasonId: season.seasonId }).go())
	);
	return results.flatMap((result) => result.data);
}

export async function getAllCardDesignsWithBestRarity() {
	const designs = await getAllCardDesigns();

	return designs.map((card, index) => {
		const bestRarity = card.bestRarityFound;

		if (bestRarity?.rarityId === NO_CARDS_OPENED_ID) {
			return {
				...bestRarity,
				...card,
				cardName: 'zzz' + index,
				artist: '?????',
				designId: 'zzz' + index,
				seasonId: '',
				seasonName: '',
				imgUrl: '',
				cardNumber: 1,
				totalOfType: bestRarity.count,
			};
		}

		return {
			...card,
			rarityName: bestRarity?.rarityName ?? '',
			rarityId: bestRarity?.rarityId ?? '',
			frameUrl: bestRarity?.frameUrl ?? '',
			rarityColor: bestRarity?.rarityColor ?? '',
			totalOfType: bestRarity?.count ?? 1,
			cardNumber: 1,
		};
	});
}

export async function getCardDesignById(args: { designId: string; userId: string }) {
	const result = await cardDesigns.query.byDesignId(args).go();
	const design = result.data[0];
	return design;
}

export async function getCardDesignAndInstancesById(args: { designId: string }) {
	const db = new Service(
		{
			cardDesigns,
			cardInstances,
		},
		config
	);

	const result = await db.collections.designAndCards(args).go({ pages: 'all' });
	return result.data;
}

export async function deleteCardDesignById(args: { designId: string }) {
	const design = await getCardDesignAndInstancesById(args);
	if (design.cardInstances.length > 0)
		return {
			success: false,
			error: 'Cannot delete design with existing instances',
		};

	const result = await cardDesigns.delete(args).go();

	return { success: true, data: result.data };
}

export async function createCardDesign(card: CreateCardDesign): Promise<DBResult<CardDesign>> {
	try {
		const result = await cardDesigns.create({ ...card }).go();
		return { success: true, data: result.data };
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` };

		if (err.code === 4001)
			// aws error, design already exists
			return {
				success: false,
				error: 'Design already exists',
			};

		// default
		return {
			success: false,
			error: err.message,
		};
	}
}

export async function updateCardDesign(args: UpdateCardDesign & { designId: string }) {
	const { designId, ...rest } = args;
	const result = await cardDesigns.update({ designId }).set(rest).go();
	return { success: true, data: result.data };
}
