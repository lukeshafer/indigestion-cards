import { Service } from 'electrodb';
import { config } from './_utils';
import { cardDesigns } from './cardDesigns';
import { season } from './season';
import { cardInstances } from './cardInstances';
import { packs } from './packs';
import { packTypes } from './packTypes';
import { users } from './users';
import { unmatchedImages } from './unmatchedImages';
import { rarities } from './rarities';
import { admins } from './admins';
import { twitchEvents } from './twitchEvents';
import { twitchEventMessageHistory } from './twitchEventMessageHistory';
import { siteConfig } from './siteConfig';
import { userLogins } from './userLogins';

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
	},
	config
);
