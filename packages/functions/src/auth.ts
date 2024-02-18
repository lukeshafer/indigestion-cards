import { Config } from 'sst/node/config';
import { Issuer } from 'openid-client';
import { EventBus } from 'sst/node/event-bus';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { AuthHandler, OauthAdapter } from 'sst/node/future/auth';
import { createNewUser, getUser } from '@lib/user';
import { getAdminUserById } from '@lib/admin-user';
import { createNewUserLogin, getUserLoginById, updateUserLogin } from '@lib/user-login';
import { setAdminEnvSession } from '@lib/session';
import { setTwitchTokens, getListOfTwitchUsersByIds } from '@lib/twitch';
import { sessions } from './sessions';

//const callbackPath = '/api/auth/callback';
export const handler = AuthHandler({
	sessions,
	providers: {
		twitchStreamer: OauthAdapter({
			issuer: await Issuer.discover('https://id.twitch.tv/oauth2'),
			clientID: Config.TWITCH_CLIENT_ID,
			clientSecret: Config.TWITCH_CLIENT_SECRET,
			scope: 'openid channel:read:redemptions channel:read:subscriptions moderator:read:chatters',
		}),
		twitchUser: OauthAdapter({
			issuer: await Issuer.discover('https://id.twitch.tv/oauth2'),
			clientID: Config.TWITCH_CLIENT_ID,
			clientSecret: Config.TWITCH_CLIENT_SECRET,
			scope: 'openid',
		}),
	},
	//async onError(error) {
	//console.error('An error occurred', { error });
	//return {
	//statusCode: 400,
	//headers: {
	//'Content-Type': 'text/plain',
	//},
	//body: 'Auth failed',
	//};
	//},
	callbacks: {
		connect: {
			async start(session, evt) {
				console.log('start', { session, evt });
			},
			async error(session) {
				console.log('start', { session });
				return undefined;
			},
		},
		async error(err) {
			console.error('callbacks.error', { err });
			return undefined;
		},
		auth: {
			async allowClient(clientID, redirect) {
				const admin = 'https://admin.' + Config.DOMAIN_NAME;
				const main = 'https://' + Config.DOMAIN_NAME;
				console.log('Checking redirect', {
					redirect,
					clientID,
					admin,
					isAdmin: redirect.startsWith(admin),
					main,
					isMain: redirect.startsWith(main),
				});
				switch (clientID) {
					case 'local':
						return true;
					case 'main':
						return redirect.startsWith(main);
					case 'admin':
						return redirect.startsWith(admin);
					default:
						return false;
				}
			},
			async start(evt) {
				console.log('Start', { evt });
			},
			async error(error) {
				console.log('Error', { error });
				console.error('An unknown error occurred', { error });
				return undefined;
			},
			async success(input, response) {
				console.log('Success', { input, response });
				setAdminEnvSession('AuthHandler', 'createNewUserLogin');
				if (input.provider === 'twitchUser') {
					const claims = input.tokenset.claims();

					const adminUser = await getAdminUserById(claims.sub);
					const userLogin = await getUserLoginById(claims.sub);
					const userProfile = await getUser(claims.sub);

					console.log({ adminUser, userLogin, userProfile });

					if (adminUser) {
						if (!userProfile) {
							await createNewUser({
								userId: adminUser.userId,
								username: adminUser.username,
							});
						}
						if (!userLogin) {
							await createNewUserLogin({
								userId: adminUser.userId,
								username: adminUser.username,
								hasProfile: true,
							});
						}

						console.log('returning admin');
						return response.session({
							type: 'admin',
							properties: {
								userId: adminUser.userId,
								username: adminUser.username,
                version: 2,
							},
						});
					}

					console.log('not admin');
					if (userLogin) {
						console.log('User login found');
						if (!userProfile) {
							console.log('User login found, but no profile');
							await createNewUser({
								userId: userLogin.userId,
								username: userLogin.username,
							});
						}
						if (!userLogin.hasProfile) {
							// user has profile now, update login to reflect that
							await updateUserLogin({
								userId: userLogin.userId,
								hasProfile: true,
							});
						}

						return response.session({
							type: 'user',
							properties: {
								userId: userLogin.userId,
								username: userLogin.username,
                version: 2,
							},
						});
					}

					console.log('user is not in database');

					// If user isn't in the database, add them
					const usernames = await getListOfTwitchUsersByIds([claims.sub]);
					if (usernames.length === 0) throw new Error('No username found');

					const userId = claims.sub;
					const username = usernames[0].display_name;

					console.log({ userProfile });
					if (!userProfile)
						await createNewUser({
							userId,
							username,
						});

					const newUser = await createNewUserLogin({
						userId,
						username,
						hasProfile: true,
					});

					if (!newUser) throw new Error('Failed to create new user');

					console.log('returning session');
					return response.session({
						type: 'user',
						properties: {
							userId: newUser.userId,
							username: newUser.username,
              version: 2,
						},
					});
				}

				if (input.provider === 'twitchStreamer') {
					const claims = input.tokenset.claims();

					const adminUser = await getAdminUserById(claims.sub);
					if (!adminUser || claims.sub !== Config.STREAMER_USER_ID)
						return response.session({
							type: 'public',
							properties: {},
						});

					if (input.tokenset.access_token && input.tokenset.refresh_token) {
						await setTwitchTokens({
							streamer_access_token: input.tokenset.access_token,
							streamer_refresh_token: input.tokenset.refresh_token,
						});
					}

					const eventBridge = new EventBridge();
					await eventBridge.putEvents({
						Entries: [
							{
								Source: 'auth',
								DetailType: 'refresh-channel-point-rewards',
								Detail: JSON.stringify({}),
								EventBusName: EventBus.eventBus.eventBusName,
							},
						],
					});

					return response.session({
						type: 'admin',
						properties: {
							userId: adminUser.userId,
							username: adminUser.username,
              version: 2,
						},
					});
				}

				throw new Error('Unknown provider');
			},
		},
	},
});
