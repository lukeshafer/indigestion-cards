export const api = {
	GIVE_PACK_TO_USER: '/api/admin/give-pack-to-user',
} as const

export const publicApi = {
	GET_ALL_USERNAMES: '/api/get-all-usernames',
	SEARCH: '/api/search',
} as const

export const authApi = {
	CALLBACK: '/api/auth/callback',
	LOGIN: '/api/auth/login',
	LOGOUT: '/api/auth/logout',
} as const

export const routes = {
	USERS: '/user',
	DESIGNS: '/design',
	SEASONS: '/season',
	RARITIES: '/rarity',
	ADMIN_USERS: '/admin-users',
	ADMIN: {
		LOGIN: '/admin/login',
		CONFIG: '/admin/config',
		GIVE_CARD: '/admin/give-card',
		GIVE_PACK: '/admin/give-pack',
		OPEN_PACKS: '/admin/open-packs',
		CREATE: {
			ADMIN: '/admin/create/admin',
			CARD_DESIGN: '/admin/create/card-design',
			CARD_DESIGN_DETAILS: '/admin/create/card-design-details',
			SEASON: '/admin/create/season',
			RARITY: '/admin/create/rarity',
			RARITY_DETAILS: '/admin/create/rarity-details',
		},
	},
} as const
