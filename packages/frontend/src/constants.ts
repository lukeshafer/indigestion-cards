export const ASSETS = {
	FAVICON: '/assets/favicon.png',
	LOGO: '/assets/logo.png',
	TONGLE: '/assets/lilindpartner.webp',
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
	STAMPS: {
		SHIT: {
			BRONZE: '/assets/stamps/shit/bronze.png',
			SILVER: '/assets/stamps/shit/silver.png',
			GOLD: '/assets/stamps/shit/gold.png',
			WHITE: '/assets/stamps/shit/white.png',
			RAINBOW: '/assets/stamps/shit/rainbow.png',
			PINK: '/assets/stamps/shit/pink.png',
		},
	},
} as const;

export const LOGOS = {
	default: ASSETS.LOGO,
	tongle: ASSETS.TONGLE as string,
} satisfies Record<string, string>;
