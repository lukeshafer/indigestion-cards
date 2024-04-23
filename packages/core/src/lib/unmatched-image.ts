import { db } from '../db';
import type { UnmatchedImageType, UnmatchedImage, CreateUnmatchedImage } from '../db.types';

export async function getUnmatchedDesignImages(
	unmatchedImageType: UnmatchedImage['unmatchedImageType']
) {
	const result = await db.entities.UnmatchedImages.query.byType({ unmatchedImageType }).go();
	return result.data;
}

export async function createUnmatchedDesignImage(image: CreateUnmatchedImage) {
	const result = await db.entities.UnmatchedImages.create(image).go();
	return result.data;
}

export async function deleteUnmatchedDesignImage(args: {
	imageId: string;
	unmatchedImageType: UnmatchedImageType;
}) {
	const result = await db.entities.UnmatchedImages.delete(args).go();
	return result.data;
}
