import { ElectroError } from 'electrodb';
import type { CardDesign, CardInstance, CreateCardDesign, UpdateCardDesign } from '../db.types';
import { db } from '../db';
import type { DBResult } from '../types';
import { lazy, Summary } from './utils';
import { z } from 'zod';

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

export async function getCardDesignAndInstancesByIdAndUser(args: {
	designId: string;
	username: string;
}): Promise<{ CardDesigns: Array<CardDesign>; CardInstances: Array<CardInstance> }> {
	const result = await db.collections
		.DesignAndCards(args)
		.where(
			(attr, ops) =>
				`${ops.field('__edb_e__')} = ${ops.escape(db.entities.CardDesigns.schema.model.entity)}` +
				` OR (${ops.eq(attr.username, args.username)} AND ${ops.exists(attr.openedAt)})`
		)
		.go({ pages: 'all' });

	console.log('result', result);
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
	const {
		data: {
			CardDesigns: [design],
			CardInstances: cards,
		},
	} = await db.collections.DesignAndCards({ designId: args.designId }).go({ pages: 'all' });

	const newTags = design.tags?.concat(...args.tags) ?? args.tags;

	const designResult = await db.entities.CardDesigns.patch({ designId: args.designId })
		.set({ tags: newTags })
		.go();

	const BATCH_SIZE = 50;
	for (let i = 0; i < cards.length; i += BATCH_SIZE) {
		const subset = cards.slice(i, i + BATCH_SIZE);
		await db.transaction
			.write(({ CardInstances }) =>
				subset.map(c =>
					CardInstances.patch({ designId: c.designId, instanceId: c.instanceId })
						.set({ tags: newTags })
						.commit()
				)
			)
			.go();
	}

	return { success: true, data: designResult.data };
}

export async function removeCardDesignTag(args: {
	designId: string;
	tag: string;
}): Promise<DBResult<Partial<CardDesign | null>>> {
	const {
		data: { CardDesigns: designs, CardInstances: cards },
	} = await db.collections.DesignAndCards({ designId: args.designId }).go({ pages: 'all' });
	if (!designs.length) return { success: false, error: 'No design found' } as const;
	const design = designs[0];

	if (!design.tags?.includes(args.tag)) {
		return { success: false, error: 'Tag does not exist' } as const;
	}

	const tagIndex = design.tags.findIndex(tag => tag === args.tag);
	const newTags = design.tags.slice();
	newTags.splice(tagIndex, 1);

	const designResult = await db.entities.CardDesigns.patch({ designId: args.designId })
		.set({ tags: newTags })
		.go();

	const BATCH_SIZE = 50;
	for (let i = 0; i < cards.length; i += BATCH_SIZE) {
		const subset = cards.slice(i, i + BATCH_SIZE);
		await db.transaction
			.write(({ CardInstances }) =>
				subset.map(c =>
					CardInstances.patch({ designId: c.designId, instanceId: c.instanceId })
						.set({ tags: newTags })
						.commit()
				)
			)
			.go();
	}

	return { success: true, data: designResult.data };
}

export async function setCardDesignGame(args: {
	designId: string;
	game: string;
}): Promise<DBResult<Partial<CardDesign>>> {
	const {
		data: { CardInstances: cards },
	} = await db.collections.DesignAndCards({ designId: args.designId }).go({ pages: 'all' });

	const designResult = await db.entities.CardDesigns.patch({ designId: args.designId })
		.set({ game: args.game })
		.go();

	const BATCH_SIZE = 50;
	for (let i = 0; i < cards.length; i += BATCH_SIZE) {
		const subset = cards.slice(i, i + BATCH_SIZE);
		await db.transaction
			.write(({ CardInstances }) =>
				subset.map(c =>
					CardInstances.patch({ designId: c.designId, instanceId: c.instanceId })
						.set({ game: args.game })
						.commit()
				)
			)
			.go();
	}

	return { success: true, data: designResult.data };
}

export type AllDesignsPageData = typeof allDesignsPageSummary extends Summary<infer T> ? T : never;
const allDesignsPageSummary = lazy(
	() =>
		new Summary({
			schema: z.array(
				z.object({
					cardName: z.string(),
					cardDescription: z.string(),
					artist: z.string(),
					designId: z.string(),
					seasonId: z.string(),
					seasonName: z.string(),
					imgUrl: z.string(),
					rarityName: z.string(),
					rarityId: z.string(),
					frameUrl: z.string(),
					rarityColor: z.string(),
					totalOfType: z.number(),
					cardNumber: z.number(),
				})
			),
			prefix: 'all-designs',
			loader: async () => {
				const designs = await getAllCardDesigns();
				return designs.map(card => ({
					...card,
					rarityName: card.bestRarityFound?.rarityName ?? '',
					rarityId: card.bestRarityFound?.rarityId ?? '',
					frameUrl: card.bestRarityFound?.frameUrl ?? '',
					rarityColor: card.bestRarityFound?.rarityColor ?? '',
					totalOfType: card.bestRarityFound?.count ?? 1,
					cardNumber: 1,
				}));
			},
		})
);

export async function loadAllDesignsPageData() {
	return allDesignsPageSummary.get('data');
}

export async function refreshAllDesignsPageData() {
	await allDesignsPageSummary.refresh('data');
}
