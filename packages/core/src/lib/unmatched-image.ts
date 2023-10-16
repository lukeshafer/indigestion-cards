import {
	unmatchedImages,
	type UnmatchedImageType,
	type UnmatchedImage,
	type CreateUnmatchedImage,
} from 'src/db/unmatchedImages';

export async function getUnmatchedDesignImages(type: UnmatchedImage['type']) {
	const result = await unmatchedImages.query.byType({ type }).go();
	return result.data;
}

export async function createUnmatchedDesignImage(image: CreateUnmatchedImage) {
	const result = await unmatchedImages.create(image).go();
	return result.data;
}

export async function deleteUnmatchedDesignImage(args: {
	imageId: string;
	type: UnmatchedImageType;
}) {
	const result = await unmatchedImages.delete(args).go();
	return result.data;
}
