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
		DELETE: '/api/admin/image',
	},
	RARITY: {
		START_EDIT: '/api/html/rarity/start-edit',
		UPDATE: '/api/admin/rarity',
		CREATE: '/api/admin/rarity',
		DELETE: '/api/admin/rarity',
	},
	PACK_TYPE: {
		CREATE: '/api/admin/pack-type',
		DELETE: '/api/admin/pack-type',
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
		UPDATE: '/api/admin/season',
		CREATE: '/api/admin/season',
		DELETE: '/api/admin/season',
	},
	DESIGN: {
		START_EDIT: '/api/html/design/start-edit',
		UPDATE: '/api/html/design/update-design',
		CREATE: '/api/admin/design',
		DELETE: '/api/admin/design',
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
	DESIGNS: '/card',
	SEASONS: '/season',
	RARITIES: '/rarity',
	ADMIN_USERS: '/admin-users',
	PACK_TYPES: '/pack-type',
	PACKS: '/packs',
	INSTANCES: '/card',
	CARDS: '/card',
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
} as const;

export const AUTH_TOKEN = 'sst_auth_token';
export const HTML_API_PATH = '/api/html';
