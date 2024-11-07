/** Only routes that are accessible without logging in */
export const PUBLIC_ROUTES = [
	'/',
	'/users',
	'/users/*',
	'/404',
	'/admin',
	'/api/get-all-usernames',
	'/api/search',
	'/api/auth/*',
	'/api/user/*',
	'/cards',
	'/cards/*',
	'/login',
	'/logout',
	'/data/usernames',
	'/trades/*',
	'/data/*',
	'/trpc/*',
	'/trpc',
] as const;

/** Routes that aren't admin only, but require a user login */
export const USER_ROUTES = ['/trades', '/api/trades', '/api/trades/*'];

/** Admin Api routes */
const api_paths = {
	PACK_TYPE: '/pack-type',
	SEASON: '/season',
	RARITY: '/rarity',
	ADMIN_USER: '/admin-user',
	PACK: '/pack',
	CARD: '/card',
	OPEN_CARD: '/open-card',
	DESIGN: '/design',
	SITE_CONFIG: '/site-config',
	UNMATCHED_IMAGE: '/unmatched-image',
	PACK_COUNT: '/pack-count',
	REFRESH_TWITCH_EVENTS: '/refresh-twitch-event-subscriptions',
	STATS: '/stats',
	TWITCH_CHATTERS: '/twitch/chatters',
	PREORDER: '/preorder',
	CONVERT_PREORDERS: '/convert-all-preorders-to-pack',
};

export const API = new Proxy(api_paths, {
	get: (target, prop) => {
		if (!(prop in target)) return undefined;
		const path = target[prop as keyof typeof target];
		return '/api/admin' + path;
	},
});

export function resolveLocalPath(path: string) {
	if (!import.meta.env.SSR) {
		return path;
	} else if (import.meta.env.DOMAIN_NAME?.startsWith('localhost')) {
		return `http://${import.meta.env.DOMAIN_NAME}${path}`;
	} else {
		return `https://${import.meta.env.DOMAIN_NAME}${path}`;
	}
}

/** User API Routes */
const user_api_paths = {
	USER: '/user',
	TRADE: '/trade',
	CARD: '/card',
};

export const USER_API = new Proxy(user_api_paths, {
	get: (target, prop) => {
		if (!(prop in target)) return undefined;
		const path = target[prop as keyof typeof target];
		return '/api/user' + path;
	},
});

/** Public API routes */
export const publicApi = {
	GET_ALL_USERNAMES: '/api/get-all-usernames',
	SEARCH: '/api/search',
} as const;

export const authApi = {
	CALLBACK: '/api/auth/callback',
	LOGIN: '/api/auth/login',
	LOGOUT: '/api/auth/logout',
} as const;

export const routes = {
	USERS: '/users',
	DESIGNS: '/cards',
	SEASONS: '/season',
	RARITIES: '/rarity',
	ADMIN_USERS: '/admin-users',
	PACK_TYPES: '/pack-type',
	PACKS: '/packs',
	INSTANCES: '/cards',
	CARDS: '/cards',
	TRADES: '/trades',
	OPEN_PACKS: '/open-packs',
} as const;

export const routeNames = {
	USER: 'Users',
	CARDS: 'Cards',
	SEASONS: 'Seasons',
	RARITIES: 'Rarities',
	ADMIN_USERS: 'Admins',
	PACK_TYPES: 'Pack Types',
	PACKS: 'Packs',
	ADMIN: 'Admin',
	ADMIN_CREATE: 'Create',
	ADMIN_EDIT: 'Edit',
	TRADES: 'Trades',
} as const;

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

export const AUTH_TOKEN = 'sst_auth_token';
export const FULL_ART_ID = 'full-art';
export const LEGACY_CARD_ID = 'legacy';
export const NO_CARDS_OPENED_ID = 'no-cards-opened';
export const SHIT_PACK_RARITY_ID = 'bronze';

export const UNTRADEABLE_RARITY_IDS = [LEGACY_CARD_ID, 'moments'];
