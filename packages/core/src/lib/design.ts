import { ElectroError } from 'electrodb';
import type { CardDesign, CreateCardDesign, UpdateCardDesign } from '../db.types';
import { db } from '../db';
import type { DBResult } from '../types';

export async function getAllCardDesigns() {
	const results = await db.entities.CardDesigns.query.allCardDesigns({}).go({ pages: 'all' });
	return results.data;
}

export async function getCardDesignById(args: { designId: string }) {
	const result = await db.entities.CardDesigns.get(args).go();
	return result.data;
}

export async function getCardDesignAndInstancesById(args: { designId: string }) {
	const result = await db.collections.DesignAndCards(args).go({ pages: 'all' });
	return result.data;
}

export async function deleteCardDesignById(args: { designId: string }) {
	const { CardInstances } = await getCardDesignAndInstancesById(args);
	if (CardInstances.length > 0)
		return {
			success: false,
			error: 'Cannot delete design with existing instances',
		};

	const result = await db.entities.CardDesigns.delete(args).go();

	return { success: true, data: result.data };
}

export async function createCardDesign(card: CreateCardDesign): Promise<DBResult<CardDesign>> {
	try {
		const result = await db.entities.CardDesigns.create({ ...card }).go();
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
	const result = await db.entities.CardDesigns.patch({ designId }).set(rest).go();
	return { success: true, data: result.data };
}
