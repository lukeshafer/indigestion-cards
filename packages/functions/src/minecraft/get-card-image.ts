import { getCardInstanceByUsername } from '@core/lib/card';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import sharp from 'sharp';
import type { CardInstance } from '../../../core/src/db.types';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
	const { instanceId, username } = event.pathParameters ?? {};

	let missingParameters = [];
	if (!instanceId) {
		missingParameters.push('instanceId');
	}
	if (!username) {
		missingParameters.push('username');
	}

	if (!instanceId || !username) {
		return {
			statusCode: 400,
			body: `Missing required parameters: ${missingParameters.join()}`,
		};
	}

	let card = await getCardInstanceByUsername({ instanceId, username });

	if (!card) {
		return {
			statusCode: 404,
			body: `Card not found with instanceId ${instanceId} for username ${username}`,
		};
	}

	let cardImageBuffer;
	try {
		cardImageBuffer = await getImage(card);
	} catch {
		return {
			body: 'Fetch failed',
			statusCode: 500,
		};
	}

	process.env.FONTCONFIG_PATH = dirname(fileURLToPath(import.meta.url)) + '/fonts';
	let minecraftFontPath: string;
	if (process.env.IS_LOCAL === 'true') {
		minecraftFontPath = './packages/functions/src/minecraft/fonts';
	} else {
		minecraftFontPath = `${process.env.FONTCONFIG_PATH}/minecraft.ttf`;
	}
	console.log(minecraftFontPath);

	const img = await sharp(cardImageBuffer)
		.resize({
			width: 128,
			kernel: sharp.kernel.mitchell,
		})
		.composite([
			{
				input: {
					text: {
						text: card.cardName,
						rgba: true,
						fontfile: minecraftFontPath,
						dpi: 49,
					},
				},
				left: 16,
				top: 9,
			},
			{
				input: {
					text: {
						text: card.cardDescription,
						rgba: true,
						fontfile: minecraftFontPath,
						dpi: 32,
						width: 95,
					},
				},
				left: 17,
				top: 126,
			},
		])
		.png()
		.toBuffer();

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
