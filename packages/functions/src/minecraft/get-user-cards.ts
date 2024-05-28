import { getUserAndCardsByMinecraftUsername } from '@core/lib/user';
import { pick } from '@core/lib/utils';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
	const { username } = event.pathParameters ?? {};

	if (!username) {
		return {
			statusCode: 400,
			body: 'Please provide a username.',
		};
	}

	const data = await getUserAndCardsByMinecraftUsername({
		minecraftUsername: username.toLowerCase(),
	});

	if (!data) {
		return {
			statusCode: 404,
			body: `User not found for mc username ${username}. Please ensure your Minecraft username is entered in your profile on indigestioncards.com.`,
		};
	}

	const user = pick(data.user, ['userId', 'minecraftUsername', 'username']);

	data.cards.sort((a, b) =>
		a.cardName.toLowerCase() > b.cardName.toLowerCase()
			? 1
			: b.cardName > a.cardName
				? -1
				: a.rarityRank - b.rarityRank || a.cardNumber - b.cardNumber
	);

	const cards = [];
	const mc_designIds = new Map<string, number>();
	let mc_nextDesignId = 1;
	const mc_rarityIds = new Map<string, number>();
	let mc_nextRarityId = 1;
	for (const card of data.cards) {
		let mc_designId = mc_designIds.get(card.designId);
		if (!mc_designId) {
			mc_designId = mc_nextDesignId++;
			mc_designIds.set(card.designId, mc_designId);
		}

		let mc_rarityId = mc_rarityIds.get(card.rarityId);
		if (!mc_rarityId) {
			mc_rarityId = mc_nextRarityId++;
			mc_rarityIds.set(card.rarityId, mc_rarityId);
		}

		cards.push({
			MC_CARD_ID: `${mc_designId}_${mc_rarityId}_${card.cardNumber}`,
			...pick(card, [
				'cardName',
				'designId',
				'rarityId',
				'seasonName',
				'rarityName',
				'instanceId',
				'cardNumber',
				'totalOfType',
			]),
		});
	}

	return {
		statusCode: 200,
		body: JSON.stringify({ user, cards }),
		headers: {
			'content-type': 'application/json',
		},
	};
}
