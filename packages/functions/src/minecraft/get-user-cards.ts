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

	data.cards.sort((a, b) => (a.designId > b.designId ? -1 : b.designId > a.designId ? 1 : 0));

	const cards = [];
	const designs = new Map<string, number>();
	let nextDesignId = 1;
	for (const card of data.cards) {
		let designId = designs.get(card.designId);
		if (!designId) {
			designId = nextDesignId++;
			designs.set(card.designId, designId);
		}

		cards.push({
			MC_CARD_ID: `${designId}_${card.totalOfType}_${card.cardNumber}`,
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
