import { getCardInstanceByUsernameDesignRarityCardNumber } from '@core/lib/card';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import sharp from 'sharp';
import type { CardInstance } from '../../../core/src/db.types';
import { FULL_ART_ID, LEGACY_CARD_ID } from '@core/constants';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
	const { designId, username, rarityId, cardNumber } = event.pathParameters ?? {};

	let missingParameters = [];
	if (!designId) {
		missingParameters.push('designId');
	}
	if (!username) {
		missingParameters.push('username');
	}
	if (!rarityId) {
		missingParameters.push('rarityId');
	}
	if (!cardNumber) {
		missingParameters.push('cardNumber');
	}

	if (!designId || !username || !rarityId || !cardNumber) {
		return {
			statusCode: 400,
			body: `Missing required parameters: ${missingParameters.join()}`,
		};
	}
	console.log({
		designId,
		username,
		cardNumber,
		rarityId,
	});

	let card = await getCardInstanceByUsernameDesignRarityCardNumber({
		designId,
		username,
		cardNumber,
		rarityId,
	});

	if (!card) {
		return {
			statusCode: 404,
			body: `Card not found: ${JSON.stringify({ designId, username, rarityId, cardNumber }, null, 2)}`,
		};
	}

	// UNCOMMENT FOR TESTING PURPOSES ONLY
	// card.cardDescription =
	// 	"Go touch some grass, do your homework, go back to school, your mother doesn't love you, watch out for campfires";

	let cardImageBuffer;
	try {
		cardImageBuffer = await getImage(card);
	} catch {
		return {
			body: 'Fetch failed',
			statusCode: 500,
		};
	}

	let filePathPrefix;
	if (process.env.IS_LOCAL === 'true') {
		filePathPrefix = './packages/functions/src/minecraft/fonts';
	} else {
		filePathPrefix = './fonts';
	}

	process.env.FONTCONFIG_PATH = filePathPrefix;

	let background =
		card.rarityColor.match(/#[a-f0-9]{6}/)?.at(0) ??
		card.rarityColor.match(/#[a-f0-9]{3}/)?.at(0) ??
		'#fff';

	let baseImg = sharp(cardImageBuffer)
		.resize({
			height: 128,
			kernel: sharp.kernel.nearest,
		})
		.flatten({ background });

	let img: Buffer;
	if (card.rarityId === FULL_ART_ID || card.rarityId === LEGACY_CARD_ID) {
		img = await baseImg.png().toBuffer();
	} else {
		img = await baseImg
			.composite([
				{
					input: {
						text: {
							text: `<span size="6pt">${card.cardName}</span>`,
							rgba: true,
							fontfile: filePathPrefix + '/minecraft.ttf',
							dpi: 72,
						},
					},
					left: 10,
					top: 6,
				},
				{
					input: {
						text: {
							text: card.cardDescription,
							rgba: true,
							fontfile: filePathPrefix + '/minecraft.ttf',
							dpi: 26,
							spacing: -1,
							width: 70,
						},
					},
					left: 12,
					top: 90,
				},
			])
			.png()
			.toBuffer();
	}
	// Convert said card into an image in minecraft style
	return {
		body: img.toString('base64'),
		isBase64Encoded: true,
		statusCode: 200,
		headers: {
			'Content-Type': 'image/png',
			'Content-Length': String(img.length),
		},
	};
}

async function getImage(card: CardInstance) {
	const url = new URL(`https://${process.env.CARD_CDN_URL!}`);
	url.pathname = `/${card.designId}/${card.rarityId}.png`;
	// console.log(url);

	const response = await fetch(url);
	// console.log({ response });
	const buffer = await response.arrayBuffer();
	// console.log({ body });

	return buffer;
}
