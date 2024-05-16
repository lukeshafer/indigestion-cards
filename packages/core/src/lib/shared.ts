// FOR SERVER AND CLIENT
// DB SHOULD NOT BE ACCESSED

const SHIT_PACK_MIN_SIZE = 5;

export const checkIsShitPack = (
	cards: Array<{
		rarityId: string;
		totalOfType: number;
	}>
) =>
	cards.length >= SHIT_PACK_MIN_SIZE &&
	cards
		.slice() // copy array to not affect input array
		.sort((a, b) => b.totalOfType - a.totalOfType)
		.every(card => card.rarityId === cards[0].rarityId);
