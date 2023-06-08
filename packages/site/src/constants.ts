/** Only routes that are accessible without logging in */
export const PUBLIC_ROUTES = [
	'/',
	'/user',
	'/user/*',
	'/404',
	'/admin',
	'/api/get-all-usernames',
	'/api/auth/*',
] as const;

export const api = {
	GET_PACK_TO_OPEN: '/api/html/get-pack-to-open',
	OPEN_CARD: '/api/html/open-card',
	SAVE_CONFIG: '/api/html/save-config',
	IMAGE: {
		DELETE: '/api/html/image/delete-unmatched-image',
	},
	RARITY: {
		START_EDIT: '/api/html/rarity/start-edit',
		UPDATE: '/api/html/rarity/update-rarity',
		CREATE: '/api/html/rarity/create-rarity',
		DELETE: '/api/html/rarity/delete-rarity',
	},
	PACK_TYPE: {
		GET_ALL: '/api/html/pack-type/get-all-pack-types',
		CREATE: '/api/html/pack-type/create-pack-type',
		DELETE: '/api/html/pack-type/delete',
	},
	PACK: {
		CREATE: '/api/html/pack/create-pack',
		DELETE: '/api/html/pack/delete-pack',
		GET_PACK_COUNT_FOR_USER: '/api/html/pack/get-pack-count-for-user',
		GET_TOTAL_PACK_COUNT: '/api/html/pack/get-total-pack-count',
		START_EDIT: '/api/html/pack/start-edit',
		UPDATE_USER: '/api/html/pack/update-pack-user',
	},
	ADMIN: {
		CREATE: '/api/html/admin/create-admin',
		DELETE: '/api/html/admin/delete-admin',
		NEW_ADMIN_FORM: '/api/html/admin/new-admin-form',
	},
	SEASON: {
		START_EDIT: '/api/html/season/start-edit',
		UPDATE: '/api/html/season/update-season',
		CREATE: '/api/html/season/create-season',
		DELETE: '/api/html/season/delete-season',
	},
	DESIGN: {
		START_EDIT: '/api/html/design/start-edit',
		UPDATE: '/api/html/design/update-design',
		CREATE: '/api/html/design/create-design',
		DELETE: '/api/html/design/delete-design',
	},
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
	INSTANCES: '/card',
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
export const HTML_API_PATH = '/api/html';
