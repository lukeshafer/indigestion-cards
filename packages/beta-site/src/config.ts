export const routes = {
	USERS: {
		href: '/users',
		name: 'Users',
	},
	CARDS: {
		href: '/cards',
		name: 'Cards',
	},
	TRADES: {
		href: '/trades',
		name: 'Trades',
	},
} as const;

export const ASSETS = {
	LOGO: '/assets/logo.png',
	EMOTES: {
		LILINDDISBLIF: '/assets/emotes/lilinddisblif.png',
		LILINDBLIF: '/assets/emotes/lilindblif.png',
		LILINDPB: '/assets/emotes/lilindpb.gif',
		LILINDOHNO: '/assets/emotes/lilindohno.gif',
	},
	CARDS: {
		CARD_BACK: '/assets/cards/card-back.png',
		DEFAULT_BASE_RARITY: '/assets/cards/default-base-rarity.png',
		HERO_CARD_1: '/assets/cards/hero_card_1.png',
		HERO_CARD_2: '/assets/cards/hero_card_2.png',
		HERO_CARD_3: '/assets/cards/hero_card_3.png',
		HIDDEN_CARD: '/assets/cards/hiddencard.png',
		SHIT_PACK: '/assets/cards/shit_pack_brown.png',
	},
} as const;
