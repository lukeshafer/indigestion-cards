import {
	getAllPacks,
	getPackById,
	getPacksByUsername,
	hidePackCards,
	sendPacksUpdatedEvent,
	setPackIsLocked,
} from '@core/lib/pack';
import { adminProcedure, authedProcedure } from '../router';
import { z } from 'astro:schema';
import { getAllCardDesigns, getCardDesignAndInstancesById } from '@core/lib/design';
import { TRPCError } from '@trpc/server';

export const packs = {
	all: adminProcedure.query(async () => await getAllPacks()),
	packCount: adminProcedure.query(async () => await getAllPacks().then(packs => packs.length)),
	byUser: authedProcedure
		.input(z.object({ username: z.string() }))
		.query(
			async ({ input }) =>
				await getPacksByUsername({ username: input.username }).then(packs =>
					packs.map(hidePackCards)
				)
		),
	packsRemaining: authedProcedure.query(async () => await getPacksRemaining()),
	sendPacksUpdatedEvent: adminProcedure.mutation(async () => await sendPacksUpdatedEvent()),
	setIsLocked: authedProcedure
		.input(z.object({ packId: z.string(), isLocked: z.boolean() }))
		.mutation(async ({ input, ctx }) => {
			const pack = await getPackById({ packId: input.packId });

			if (!pack) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Pack does not exist.',
				});
			}

			if (!pack.userId || pack.userId !== ctx.session.properties.userId) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'You must own the pack to perform this action.',
				});
			}

			await setPackIsLocked({
				isLocked: input.isLocked,
				packId: input.packId,
			}).catch(err => {
				console.error(err);
				throw err;
			});

			await sendPacksUpdatedEvent();
		}),
};

export async function getPacksRemaining() {
	const designs = await getAllCardDesigns();

	const promises: Array<Promise<DesignCountData>> = [];
	for (let design of designs) {
		promises.push(
			getCardDesignAndInstancesById({ designId: design.designId }).then(result => {
				const ownedCards = result.CardInstances.length;
				const possibleCards =
					design.rarityDetails?.reduce((acc, rarity) => {
						return acc + rarity.count;
					}, 0) ?? 0;
				const remainingCards = possibleCards - ownedCards;

				return {
					seasonId: design.seasonId,
					seasonName: design.seasonName,
					ownedCards,
					possibleCards,
					remainingCards,
				};
			})
		);
	}
	const designCountData = await Promise.all(promises);

	const counts = new Map<string, DesignCountData>();
	for (let data of designCountData) {
		const prev = counts.get(data.seasonId);
		counts.set(data.seasonId, {
			seasonId: data.seasonId,
			seasonName: data.seasonName,
			ownedCards: data.ownedCards + (prev?.ownedCards ?? 0),
			possibleCards: data.possibleCards + (prev?.possibleCards ?? 0),
			remainingCards: data.remainingCards + (prev?.remainingCards ?? 0),
		});
	}

	return Array.from(counts.values());
}

interface DesignCountData {
	seasonId: string;
	seasonName: string;
	ownedCards: number;
	possibleCards: number;
	remainingCards: number;
}
