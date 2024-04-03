import { SiteHandler } from "@lil-indigestion-cards/core/lib/api";
import { createCardInstance } from "@lil-indigestion-cards/core/lib/card";
import { generateInstanceId } from "@lil-indigestion-cards/core/lib/card-pool";
import {
	createCardDesign,
	deleteCardDesignById,
} from "@lil-indigestion-cards/core/lib/design";
import {
	createS3Url,
	moveImageBetweenBuckets,
} from "@lil-indigestion-cards/core/lib/images";
import { generatePackId } from "@lil-indigestion-cards/core/lib/pack";
import { deleteUnmatchedDesignImage } from "@lil-indigestion-cards/core/lib/unmatched-image";
import { Bucket } from "sst/node/bucket";
import { z } from "zod";

export const handler = SiteHandler(
	{
		schema: {
			season: "string",
			imgUrl: "string",
			imageKey: "string",
			cardName: "string",
			designId: "string",
			cardDescription: "string",
			artist: "string",
			rarity: "string",
			users: "string",
		},
		authorizationType: "admin",
	},
	async (_, { params }) => {
		const { seasonId, seasonName } = JSON.parse(params.season);

		const users = z
			.array(
				z.object({
					username: z.string(),
					userId: z.string(),
				}),
			)
			.parse(JSON.parse(params.users));

		const rarity = z
			.object({
				rarityId: z.string(),
				rarityName: z.string(),
				frameUrl: z.string(),
				rarityColor: z.string(),
				count: z.number().default(users.length),
			})
			.parse(JSON.parse(params.rarity));

		const newUrl = createS3Url({
			bucket: Bucket.CardDesigns.bucketName,
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

		if (!createDesignResult.success)
			return { statusCode: 400, body: createDesignResult.error };
		const design = createDesignResult.data;

		try {
			await moveImageBetweenBuckets({
				sourceBucket: Bucket.CardDrafts.bucketName,
				key: params.imageKey,
				destinationBucket: Bucket.CardDesigns.bucketName,
			});
		} catch (e) {
			console.error(e);
			await deleteCardDesignById({ designId: params.designId });
			return {
				statusCode: 500,
				body: "An error occurred converting draft to design. Please try again and contact support if you have more issues.",
			};
		}
		await deleteUnmatchedDesignImage({
			imageId: params.imageKey,
			type: "cardDesign",
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
						cardNumber: index,
					}),
					cardNumber: index,
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
					rarityColor: rarity.rarityColor,
					totalOfType: rarity.count,
					packId: generatePackId({ userId: user.userId, prefix: "moment-" }),
					openedAt: new Date().toISOString(),
				}),
			),
		);

		return {
			statusCode: 200,
			body: "Successfully created moment card and assigned to users",
		};
	},
);
