import { z } from 'zod';

export type PackDetails = z.infer<typeof packSchema>;
export type PackDetailsWithoutUser = z.infer<typeof packSchemaWithoutUser>;
export const packSchema = z.object({
	userId: z.string(),
	username: z.string(),
	packCount: z.number(),
	packType: z.object({
		packTypeId: z.string(),
		packTypeName: z.string(),
		packTypeCategory: z.enum(['season', 'custom']),
		cardCount: z.number(),
		designs: z
			.array(
				z.object({
					designId: z.string(),
					cardName: z.string(),
					imgUrl: z.string(),
				})
			)
			.optional(),
		seasonId: z.string().optional(),
		seasonName: z.string().optional(),
	}),
});
export const packSchemaWithoutUser = packSchema.omit({ userId: true, username: true });

export type Season = z.infer<typeof seasonSchema>;
const seasonSchema = z.object({
	seasonId: z.string(),
	seasonName: z.string(),
});

export type CardDesignElement = z.infer<typeof cardDesignsSchema>[number];
const cardDesignsSchema = z.array(
	z.object({
		designId: z.string(),
		cardName: z.string(),
		imgUrl: z.string(),
	})
);

export type Category = z.infer<typeof validCategories>;
const validCategories = z.enum(['season', 'custom']);

export function parsePackTypeContents(options: {
	category: string;
	season?: string | null;
	cardDesigns?: string | null;
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
	const season = JSON.parse(unparsedSeason) as unknown;
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
