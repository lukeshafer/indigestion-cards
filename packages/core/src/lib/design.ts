import { ElectroError } from 'electrodb';
import type { CardDesign, CardInstance, CreateCardDesign, UpdateCardDesign } from '../db.types';
import { db } from '../db';
import type { DBResult } from '../types';

export async function getAllCardDesigns(): Promise<Array<CardDesign>> {
	const results = await db.entities.CardDesigns.query.allCardDesigns({}).go({ pages: 'all' });
	return results.data;
}

export async function getCardDesignById(args: { designId: string }): Promise<CardDesign | null> {
	const result = await db.entities.CardDesigns.get(args).go();
	return result.data;
}

export async function getCardDesignAndInstancesById(args: {
	designId: string;
}): Promise<{ CardDesigns: Array<CardDesign>; CardInstances: Array<CardInstance> }> {
	const result = await db.collections.DesignAndCards(args).go({ pages: 'all' });
	return result.data;
}

export async function deleteCardDesignById(args: {
	designId: string;
}): Promise<DBResult<{ designId: string } | null>> {
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

export async function updateCardDesign(
	args: UpdateCardDesign & { designId: string }
): Promise<DBResult<Partial<CardDesign>>> {
	const { designId, ...rest } = args;
	const result = await db.entities.CardDesigns.patch({ designId }).set(rest).go();
	return { success: true, data: result.data };
}

export async function addCardDesignTag(args: {
	designId: string;
	tags: Array<string>;
}): Promise<DBResult<Partial<CardDesign>>> {
	const result = await db.entities.CardDesigns.patch({ designId: args.designId })
		.append({
			tags: args.tags,
		})
		.go();

	return { success: true, data: result.data };
}

export async function removeCardDesignTag(args: { designId: string; tag: string }): Promise<DBResult<Partial<CardDesign>>> {
	const { data: designs } = await db.entities.CardDesigns.query
		.primary({ designId: args.designId })
		.go();
	if (!designs.length) return { success: false, error: 'No design found' } as const;
	const design = designs[0];

	if (!design.tags?.includes(args.tag)) {
		return { success: false, error: 'Tag does not exist' } as const;
	}

	const tagIndex = design.tags.findIndex(tag => tag === args.tag);
	const tagsCopy = design.tags.slice();
	tagsCopy.splice(tagIndex, 1);

	const result = await db.entities.CardDesigns.patch({ designId: args.designId })
		.set({
			tags: tagsCopy,
		})
		.go();

	return { success: true, data: result.data };
}
