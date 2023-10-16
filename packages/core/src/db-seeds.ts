import { admins } from './db/admins';
import { siteConfig } from './db/siteConfig';
import { getUserByLogin } from './twitch-helpers';
import { createAdminUser } from './lib/admin-user';

export async function seedAdmins() {
	console.log('Seeding admins...');
	const requiredAdmins = ['snailyLuke', 'lil_indigestion'];

	let finalResult = true;
	for (const username of requiredAdmins) {
		console.log(`Seeding admin ${username}...`);
		const existingAdmin = await admins.query.allAdmins({ username: username }).go();
		if (existingAdmin.data.length > 0) {
			console.log(`Admin ${username} already exists, skipping...`);
			console.log(existingAdmin.data);
			continue;
		}

		const twitchUser = await getUserByLogin(username);
		if (!twitchUser) {
			console.log(`Could not find user ${username} on Twitch, skipping...`);
			continue;
		}
		const { id, display_name } = twitchUser;

		const result = await createAdminUser({ userId: id, username: display_name });
		if (!result.success) {
			console.log(`Failed to create admin ${username}: ${result.error}`);
			finalResult = false;
		} else {
			console.log(`Created admin ${username}!`);
		}
	}

	console.log('Done seeding admins! Final result:', finalResult);
	return finalResult;
}

export async function seedSiteConfig() {
	const config = await siteConfig.query.primary({}).go();
	if (config.data.length > 0) {
		console.log('Site config already exists, skipping...');
		return true;
	}

	console.log('Seeding site config...');
	const result = await siteConfig
		.create({
			baseRarity: {
				rarityId: 'default',
				rarityName: 'Default',
				rarityColor: '#fff',
				frameUrl: '/assets/cards/default-base-rarity.png',
			},
			messages: [],
		})
		.go();
	return result;
}
