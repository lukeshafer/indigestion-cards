import { z } from 'astro/zod';

export type Category = z.infer<typeof validCategories>;
const validCategories = z.enum(['season', 'custom']);

type Season = z.infer<typeof seasonSchema>;
const seasonSchema = z.object({
	seasonId: z.string(),
	seasonName: z.string(),
});

type CardDesignElement = z.infer<typeof cardDesignsSchema>[number];
const cardDesignsSchema = z.array(
	z.object({
		designId: z.string(),
		cardName: z.string(),
		imgUrl: z.string(),
	})
);

export function validatePackType(
	options: {
		packTypeName: string | null;
		packTypeId: string | null;
		description: string | null;
		cardCountPerPack: string | null;
		category: string | null;
		season: string | null;
		cardDesigns: string | null;
	},
	errorList: string[]
) {
	if (!options.packTypeName) errorList.push('Missing packTypeName.');
	if (!options.packTypeId) errorList.push('Missing packTypeId.');
	if (!options.cardCountPerPack || !Number(options.cardCountPerPack))
		errorList.push('Missing cardCountPerPack.');
	if (!options.category) errorList.push('Missing category.');
	if (options.category === 'season' && !options.season) errorList.push('Missing season.');
	if (options.category === 'custom' && !options.cardDesigns)
		errorList.push('Missing cardDesigns.');
	if (errorList.length) return false;
	return true;
}

export function getPackTypeContents(options: {
	category: string;
	season?: string;
	cardDesigns?: string;
}):
	| { success: false; error: string }
	| { success: true; season?: Season; designs?: CardDesignElement[] } {
	const categoryResult = validCategories.safeParse(options.category);

	if (!categoryResult.success) return { success: false, error: 'Invalid category' };
	const category = categoryResult.data;

	if (category === 'season') return parseSeason(options.season!);
	if (category === 'custom') return parseCardDesigns(options.cardDesigns!);
	return { success: false, error: 'Invalid category' };
}

function parseSeason(unparsedSeason: string) {
	const season = JSON.parse(unparsedSeason!) as unknown;
	const result = seasonSchema.safeParse(season);
	if (!result.success)
		return { success: false, error: 'Invalid season. ' + result.error.format() } as const;

	return { success: true, season: result.data } as const;
}

function parseCardDesigns(unparsedDesigns: string) {
	const designs = JSON.parse(unparsedDesigns!) as unknown[];
	const result = cardDesignsSchema.safeParse(designs);
	if (!result.success)
		return {
			success: false,
			error: 'Invalid card designs. ' + result.error.format(),
		} as const;

	return { success: true, designs: result.data } as const;
}
