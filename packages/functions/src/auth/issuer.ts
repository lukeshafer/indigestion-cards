import { issuer } from '@openauthjs/openauth';
import { handle } from 'hono/aws-lambda';
import { subjects } from './subjects';
import { TwitchProvider } from '@openauthjs/openauth/provider/twitch';
import { Resource } from 'sst';
import { setAdminEnvSession } from '@core/lib/session';
import { getAdminUserById } from '@core/lib/admin-user';
import { createNewUserLogin, getUserLoginById, updateUserLogin } from '@core/lib/user-login';
import { createNewUser, getUser } from '@core/lib/user';
import type { Admin, User, UserLogin } from '@core/types';
import { getListOfTwitchUsersByIds, setTwitchTokens } from '@core/lib/twitch';
import { EventBridge } from '@aws-sdk/client-eventbridge';

const eventBridge = new EventBridge();

const app = issuer({
	subjects,
	providers: {
		twitch: TwitchProvider({
			clientID: Resource.TWITCH_CLIENT_ID.value,
			clientSecret: Resource.TWITCH_CLIENT_SECRET.value,
			scopes: ['openid'],
		}),
		twitchStreamer: TwitchProvider({
			clientID: Resource.TWITCH_CLIENT_ID.value,
			clientSecret: Resource.TWITCH_CLIENT_SECRET.value,
			scopes: [
				'openid',
				'channel:read:redemptions',
				'channel:read:subscriptions',
				'moderator:read:chatters',
			],
		}),
	},
	async allow(input) {
		const adminUrl = 'https://admin.' + Resource.CardsParams.DOMAIN_NAME;
		const mainUrl = 'https://admin.' + Resource.CardsParams.DOMAIN_NAME;

		switch (input.clientID) {
			case 'local':
				return true;
			case 'main':
				return input.redirectURI.startsWith(mainUrl);
			case 'admin':
				return input.redirectURI.startsWith(adminUrl);
			default:
				return false;
		}
	},
	async success(response, input) {
		setAdminEnvSession('AuthIssuer', 'createNewUserLogin');
		console.log('Authorizing user...');

		if (input.provider === 'twitch') {
      console.log({tokensetraw: input.tokenset.raw})
			const userId = input.tokenset.raw.sub;
			const adminUser = await getAdminUserById(userId);
			const userLogin = await getUserLoginById(userId);
			const userProfile = await getUser(userId);

			console.log({ adminUser, userLogin, userProfile });

			if (adminUser) {
				console.log('Verified admin user.', adminUser);
				await handleAdminUserAuth({ adminUser, userLogin, userProfile });

				return response.subject('admin', {
					userId: adminUser.userId,
					username: adminUser.username,
					version: 3,
				});
			}

			if (userLogin) {
				console.log('User login exists.');
				await handleExistingUserLogin({ userLogin, userProfile });

				return response.subject('user', {
					userId: userLogin.userId,
					username: userLogin.username,
					version: 3,
				});
			}

			console.log('User is not yet in database.', { userId });

			const userData = await handleNewUserLogin({ userId, userProfile });

			return response.subject('user', {
				userId: userData.userId,
				username: userData.username,
				version: 3,
			});
		}

		if (input.provider === 'twitchStreamer') {
			const userId = input.tokenset.raw.sub;
			const adminUser = await getAdminUserById(userId);

			if (!adminUser || userId !== Resource.CardsParams.STREAMER_USER_ID) {
				return response.subject('public', {});
			}

			if (input.tokenset.access && input.tokenset.refresh) {
				await setTwitchTokens({
					streamer_access_token: input.tokenset.access,
					streamer_refresh_token: input.tokenset.refresh,
				});
			}

			await eventBridge.putEvents({
				Entries: [
					{
						Source: 'auth',
						DetailType: 'refresh-channel-point-rewards',
						Detail: JSON.stringify({}),
						EventBusName: Resource.EventBus.name,
					},
				],
			});

			return response.subject('admin', {
				userId: adminUser.userId,
				username: adminUser.username,
				version: 3,
			});
		}

		throw new Error('Unknown provider');
	},
});

async function handleAdminUserAuth(opts: {
	adminUser: Admin;
	userLogin: UserLogin | null;
	userProfile: User | null;
}) {
	if (opts.userProfile == null) {
		await createNewUser({
			userId: opts.adminUser.userId,
			username: opts.adminUser.username,
		});
	}

	if (opts.userLogin == null) {
		await createNewUserLogin({
			userId: opts.adminUser.userId,
			username: opts.adminUser.username,
			hasProfile: true,
		});
	}
}

async function handleExistingUserLogin(opts: { userLogin: UserLogin; userProfile: User | null }) {
	if (opts.userProfile == null) {
		console.log('User login found, but no profile exists yet.');
		await createNewUser({
			userId: opts.userLogin.userId,
			username: opts.userLogin.username,
		});
	}

	if (opts.userLogin.hasProfile != true) {
		// user has profile now, update login to reflect that
		await updateUserLogin({
			userId: opts.userLogin.userId,
			hasProfile: true,
		});
	}
}

async function handleNewUserLogin(opts: { userId: string; userProfile: User | null }) {
	const usernames = await getListOfTwitchUsersByIds([opts.userId]);
	if (usernames.length === 0) {
		throw new Error(`No twitch user found with ID ${opts.userId}`);
	}

	const username = usernames[0].display_name;

	if (opts.userProfile == null) {
		await createNewUser({ userId: opts.userId, username });
	}

	const userLogin = await createNewUserLogin({
		userId: opts.userId,
		username,
		hasProfile: true,
	});

	if (userLogin == null) {
		throw new Error(`Failed to create new user login for ${username} (${opts.userId})`);
	}

	return {
		userId: userLogin.userId,
		username: userLogin.username,
	};
}

export const handler = handle(app);
