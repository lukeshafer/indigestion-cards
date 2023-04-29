import type { APIRoute } from 'astro'
import { getAllUsers, getUserByUserName } from '@lil-indigestion-cards/core/user'
import { useAdmin } from '@/session'
import { routes } from '@/constants'

export const get: APIRoute = async (ctx) => {
	const session = useAdmin(ctx.cookies)
	if (!session) return ctx.redirect('/')

	const username = ctx.url.searchParams.get('username')

	if (!username) {
		const referer = new URL(ctx.request.headers.get('referer') || '/')
		referer.searchParams.set('alert', 'Please enter a username')
		return new Response(null, {
			status: 302,
			headers: {
				Location: referer.toString(),
			},
		})
	}

	const user = await getUserByUserName(username)
	if (user) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: `${routes.USERS}/${user.username}`,
			},
		})
	}

	const users = await getAllUsers()
	const similarUsers = users.filter((user) => user.username.includes(username))
	if (similarUsers.length === 1) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: `${routes.USERS}/${similarUsers[0]!.username}`,
			},
		})
	}

	const referer = new URL(ctx.request.headers.get('referer') || '/')

	if (similarUsers.length > 1) {
		referer.searchParams.set('alert', 'User not found')
	} else {
		referer.searchParams.set('alert', 'User not found, too many similar users')
	}
	return new Response(null, {
		status: 302,
		headers: {
			Location: referer.toString(),
		},
	})
}
