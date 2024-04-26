import { db as DB_OLD } from './db-old/db-service';
import { db as DB_NEW } from '../db';
import * as DB from '../db.types';

export default async function MEGA_SUPER_MIGRATION() {
	const Old = DB_OLD.entities;
	const New = DB_NEW.entities;

	await migrate<DB.Admin>(Old.admins, New.Admins);
	await migrate<DB.CardDesign>(Old.cardDesigns, New.CardDesigns);
	await migrate<DB.CardInstance>(Old.cardInstances, New.CardInstances);
	await migrate<DB.MomentRedemption>(Old.momentRedemptions, New.MomentRedemptions);
	await migrate<DB.PackType>(Old.packTypes, New.PackTypes);
	await migrate<DB.Pack>(Old.packs, New.Packs);
	await migrate<DB.Preorder>(Old.preorders, New.Preorders);
	await migrate<DB.Rarity>(Old.rarities, New.Rarities);
	await migrate<DB.Season>(Old.season, New.Seasons);
	await migrate<DB.SiteConfig>(Old.siteConfig, New.SiteConfig);
	await migrate<DB.Trade>(Old.trades, New.Trades);
	await migrate<DB.TwitchEventMessageHistory>(
		Old.twitchEventMessageHistory,
		New.TwitchEventMessageHistory
	);
	await migrate<DB.TwitchEvent>(Old.twitchEvents, New.TwitchEvents);
	await migrateUnmatchedImages(Old.unmatchedImages, New.UnmatchedImages);
	await migrate<DB.UserLogin>(Old.userLogins, New.UserLogins);
	await migrate<DB.User>(Old.users, New.Users);
}

type OLD<T> = { scan: { go(options: { pages: 'all' }): Promise<{ data: T[] }> } };
type NEW<T> = { put(items: T[]): { go(): Promise<{ unprocessed: Partial<T>[] }> } };

async function migrate<T>(from: OLD<T>, to: NEW<T>) {
	const oldItems = await from.scan.go({ pages: 'all' });
	const { unprocessed } = await to.put(oldItems.data).go();

	// after this is tested, TODO: delete all the old items

	if (unprocessed.length > 0) {
		console.log('Unprocessed items', { unprocessed });
	}

	console.log('Processed', oldItems.data.length - unprocessed.length, 'items');
	console.log('Failed to process', unprocessed.length, 'items');
}

async function migrateUnmatchedImages(
	from: OLD<import('./db-old/unmatchedImages').UnmatchedImage>,
	to: NEW<DB.UnmatchedImage>
) {
	const oldItems = await from.scan.go({ pages: 'all' });

	const { unprocessed } = await to
		.put(oldItems.data.map(item => ({ ...item, unmatchedImageType: item.type })))
		.go();

	// after this is tested, TODO: delete all the old items

	if (unprocessed.length > 0) {
		console.log('Unprocessed items', { unprocessed });
	}
	console.log('Processed', oldItems.data.length - unprocessed.length, 'items');
	console.log('Failed to process', unprocessed.length, 'items');
}
