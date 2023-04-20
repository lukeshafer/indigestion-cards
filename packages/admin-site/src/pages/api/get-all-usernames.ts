import { getAllUsers } from '@lil-indigestion-cards/core/user'
import type { APIRoute } from 'astro'

export const get: APIRoute = async () => {
	const users = await getAllUsers()

	return {
		statusCode: 200,
		body: JSON.stringify(users.map((user) => user.username)),
	}
}
