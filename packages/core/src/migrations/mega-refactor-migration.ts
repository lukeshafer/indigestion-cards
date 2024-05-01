import { db as DB_OLD } from './db-old/db-service';
import { db as DB_NEW } from '../db';
import * as DB from '../db.types';
import { TWITCH_GIFT_SUB_ID } from '../constants';

export default async function MEGA_SUPER_MIGRATION() {
	const Old = DB_OLD.entities;
	const New = DB_NEW.entities;

	try {
		await migrate<DB.Admin>('Admins', Old.admins, New.Admins);
		await migrate<DB.CardDesign>('Card designs', Old.cardDesigns, New.CardDesigns);
		await migrate<DB.CardInstance>('Card instances', Old.cardInstances, New.CardInstances);
		await migrate<DB.MomentRedemption>(
			'Moment redemptions',
			Old.momentRedemptions,
			New.MomentRedemptions
		);
		await migrate<DB.PackType>('Pack types', Old.packTypes, New.PackTypes);
		await migrate<DB.Pack>('Packs', Old.packs, New.Packs);
		await migrate<DB.Preorder>('Preorders', Old.preorders, New.Preorders);
		await migrate<DB.Rarity>('Rarities', Old.rarities, New.Rarities);
		await migrate<DB.Season>('Seasons', Old.season, New.Seasons);
		await migrate<DB.SiteConfig>('Site config', Old.siteConfig, New.SiteConfig);
		await migrate<DB.Trade>('Trade', Old.trades, New.Trades);
		await migrate<DB.TwitchEventMessageHistory>(
			'TwitchEventMessageHistory',
			Old.twitchEventMessageHistory,
			New.TwitchEventMessageHistory
		);
		await migrateTwitchEvents(Old.twitchEvents, New.TwitchEvents);
		await migrateUnmatchedImages(Old.unmatchedImages, New.UnmatchedImages);
		await migrate<DB.UserLogin>('User logins', Old.userLogins, New.UserLogins);
		await migrate<DB.User>('Users', Old.users, New.Users);
	} catch (error) {
		console.error(error);
		console.log(error.fields);
		throw error;
	}
}

type OLD<T> = {
	scan: { go(options: { pages: 'all' }): Promise<{ data: T[] }> };
	delete(arg: Partial<T>): { go(): Promise<{ data: Partial<T> }> };
};
type NEW<T> = { put(items: T[]): { go(): Promise<{ unprocessed: Partial<T>[] }> } };

async function migrate<T>(name: string, from: OLD<T>, to: NEW<T>) {
	console.log(`Migrating ${name}`);

	console.log('Retrieving old items...');
	const oldItems = await from.scan.go({ pages: 'all' });
	console.log('Putting old items on new entity');
	// const newItems = await to.scan.go({ pages: 'all' });
	const { unprocessed } = await to.put(oldItems.data).go();

	if (unprocessed.length > 0) {
		console.log('Unprocessed items', { unprocessed });
		console.log('Old items will not be deleted');
	} else {
		await Promise.all(oldItems.data.map(item => from.delete(item).go()));
		console.log('Items deleted.');
	}

	console.log('Processed', oldItems.data.length - unprocessed.length, 'items');
	console.log('Failed to process', unprocessed.length, 'items');
}

async function migrateUnmatchedImages(
	from: OLD<import('./db-old/unmatchedImages').UnmatchedImage>,
	to: NEW<DB.UnmatchedImage>
) {
	console.log('Migrating unmatched images');
	const oldItems = await from.scan.go({ pages: 'all' });

	const { unprocessed } = await to
		.put(oldItems.data.map(item => ({ ...item, unmatchedImageType: item.type })))
		.go();

	if (unprocessed.length > 0) {
		console.log('Unprocessed items', { unprocessed });
	} else {
		await Promise.all(oldItems.data.map(item => from.delete(item).go()));
		console.log('Items deleted.');
	}

	console.log('Processed', oldItems.data.length - unprocessed.length, 'items');
	console.log('Failed to process', unprocessed.length, 'items');
}

async function migrateTwitchEvents(
	from: OLD<import('./db-old/twitchEvents').TwitchEvent>,
	to: NEW<DB.TwitchEvent>
) {
	console.log('Migrating twitch events');
	const oldItems = (await from.scan.go({ pages: 'all' })).data.map(value => {
		if (value.eventId === TWITCH_GIFT_SUB_ID) return { ...value, eventName: '5 Gift Sub' };
		else return value;
	});

	const { unprocessed } = await to.put(oldItems.map(item => ({ ...item }))).go();
	const deletedItemCount = oldItems.length - unprocessed.length;

	if (unprocessed.length > 0) {
		console.log('Unprocessed items', { unprocessed });
	} else {
		await Promise.all(oldItems.map(item => from.delete(item).go()));
		console.log(deletedItemCount, 'Items deleted.');
	}

	console.log('Processed', deletedItemCount, 'items');
	console.log('Failed to process', unprocessed.length, 'items');
}
