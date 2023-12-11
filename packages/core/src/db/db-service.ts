import { Service } from 'electrodb';
import { admins } from './admins';
import { cardDesigns } from './cardDesigns';
import { cardInstances } from './cardInstances';
import { config } from './_utils';
import { packTypes } from './packTypes';
import { packs } from './packs';
import { preorders } from './preorders';
import { rarities } from './rarities';
import { season } from './season';
import { siteConfig } from './siteConfig';
import { trades } from './trades';
import { twitchEventMessageHistory } from './twitchEventMessageHistory';
import { twitchEvents } from './twitchEvents';
import { unmatchedImages } from './unmatchedImages';
import { userLogins } from './userLogins';
import { users } from './users';

export const db = new Service(
	{
		cardDesigns,
		season,
		cardInstances,
		packs,
		packTypes,
		users,
		unmatchedImages,
		rarities,
		admins,
		twitchEvents,
		twitchEventMessageHistory,
		siteConfig,
		userLogins,
    preorders,
    trades,
	},
	config
);
