export const api = {
	GIVE_PACK_TO_USER: '/api/admin/give-pack-to-user',
	CREATE_CARD_SEASON: '/api/admin/create-card-season',
	CREATE_CARD_DESIGN: '/api/admin/create-card-design',
	CREATE_RARITY: '/api/admin/create-rarity',
	CREATE_PACK_TYPE: '/api/admin/create-pack-type',
	DELETE_CARD_DESIGN: '/api/admin/delete-card-design',
	DELETE_CARD_SEASON: '/api/admin/delete-card-season',
	DELETE_UNMATCHED_IMAGE: '/api/admin/delete-unmatched-image',
	DELETE_RARITY: '/api/admin/delete-rarity',
	CREATE_ADMIN_USER: '/api/admin/create-admin-user',
	DELETE_ADMIN_USER: '/api/admin/delete-admin-user',
	REVOKE_PACK: '/api/admin/revoke-pack',
	OPEN_CARD: '/api/admin/open-card',
	GET_ALL_PACK_TYPES: '/api/get-all-pack-types',
	UPDATE_RARITY: '/api/admin/update-rarity',
} as const;

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
	USERS: '/user',
	DESIGNS: '/design',
	SEASONS: '/season',
	RARITIES: '/rarity',
	ADMIN_USERS: '/admin-users',
	PACK_TYPES: '/pack-type',
	PACKS: '/packs',
	ADMIN: {
		LOGIN: '/admin',
		GIVE_CARD: '/admin/give-card',
		GIVE_PACK: '/admin/give-pack',
		OPEN_PACKS: '/admin/open-packs',
		SITE_CONFIG: '/admin/site-config',
		CREATE: {
			ADMIN: '/admin/create/admin',
			CARD_DESIGN: '/admin/create/card-design',
			CARD_DESIGN_DETAILS: '/admin/create/card-design-details',
			SEASON: '/admin/create/season',
			RARITY: '/admin/create/rarity',
			RARITY_DETAILS: '/admin/create/rarity-details',
			PACK_TYPE: '/admin/create/pack-type',
		},
		EDIT: {
			ADMIN: '/admin/edit/admin',
			CARD_DESIGN: '/admin/edit/card-design',
			SEASON: '/admin/edit/season',
			RARITY: '/admin/edit/rarity',
			PACK_TYPE: '/admin/edit/pack-type',
		},
	},
} as const;

export const AUTH_TOKEN = 'sst_auth_token';
