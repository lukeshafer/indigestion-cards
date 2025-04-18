import { SiteHandler } from '@core/lib/api';
import { createCardInstance } from '@core/lib/card';
import { generateInstanceId } from '@core/lib/card-pool';
import { createCardDesign, deleteCardDesignById } from '@core/lib/design';
import { createS3Url, moveImageBetweenBuckets } from '@core/lib/images';
import { deleteMomentRedemption, momentInputSchemas } from '@core/lib/moments';
import { generatePackId } from '@core/lib/pack';
import { getRarityRankForRarity } from '@core/lib/site-config';
import { deleteUnmatchedDesignImage } from '@core/lib/unmatched-image';
import { Resource } from 'sst';

export const handler = SiteHandler(
	{
		schema: {
			season: 'string',
			imgUrl: 'string',
			imageKey: 'string',
			cardName: 'string',
			designId: 'string',
			cardDescription: 'string',
			artist: 'string',
			rarity: 'string',
			users: 'string',
			momentDate: 'string',
		},
		authorizationType: 'admin',
	},
	async (_, { params }) => {
		const { seasonId, seasonName } = JSON.parse(params.season);

		const users = momentInputSchemas.users.parse(JSON.parse(params.users));

		const rarity = {
			...momentInputSchemas.rarity.parse(JSON.parse(params.rarity)),
			count: users.length,
		};

		const newUrl = createS3Url({
			bucket: Resource.CardDesigns.name,
			key: params.imageKey,
		});

		const createDesignResult = await createCardDesign({
			seasonId,
			seasonName,
			cardName: params.cardName,
			cardDescription: params.cardDescription,
			artist: params.artist,
			designId: params.designId,
			imgUrl: newUrl,
			rarityDetails: [rarity],
			bestRarityFound: rarity,
		});

		if (!createDesignResult.success) return { statusCode: 400, body: createDesignResult.error };
		const design = createDesignResult.data;

		try {
			await moveImageBetweenBuckets({
				sourceBucket: Resource.CardDrafts.name,
				key: params.imageKey,
				destinationBucket: Resource.CardDesigns.name,
			});
		} catch (e) {
			console.error(e);
			await deleteCardDesignById({ designId: params.designId });
			return {
				statusCode: 500,
				body: 'An error occurred converting draft to design. Please try again and contact support if you have more issues.',
			};
		}
		await deleteUnmatchedDesignImage({
			imageId: params.imageKey,
			unmatchedImageType: 'cardDesign',
		});

		// give cards to users
		const shuffledUsers = users.slice().sort(() => Math.random() - 0.5);
		await Promise.all(
			shuffledUsers.map(async (user, index) =>
				createCardInstance({
					instanceId: generateInstanceId({
						seasonId: design.seasonId,
						designId: design.designId,
						rarityId: rarity.rarityId,
						cardNumber: index + 1,
					}),
					cardNumber: index + 1,
					userId: user.userId,
					username: user.username,
					minterId: user.userId,
					minterUsername: user.username,
					seasonId: design.seasonId,
					seasonName: design.seasonName,
					designId: design.designId,
					cardName: design.cardName,
					cardDescription: design.cardDescription,
					imgUrl: design.imgUrl,
					rarityId: rarity.rarityId,
					frameUrl: rarity.frameUrl,
					rarityName: rarity.rarityName,
					rarityRank: await getRarityRankForRarity(rarity),
					rarityColor: rarity.rarityColor,
					totalOfType: rarity.count,
					packId: generatePackId({ userId: user.userId, prefix: 'moment-' }),
					openedAt: new Date().toISOString(),
				}).then(() => {
					deleteMomentRedemption({ momentDate: params.momentDate, userId: user.userId });
				})
			)
		);

		return {
			statusCode: 200,
			body: 'Successfully created moment card and assigned to users',
		};
	}
);
