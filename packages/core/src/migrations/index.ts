import { migration as secretsToSSM } from './secrets-to-ssm';

import {
	packs1To2,
	instances1To2,
	cardTradeHistoryFlipToFrom,
	designs1To2,
	addBestRarityFound,
} from './db-old-migrations';

// TODO: remove legacy migrations, once final migration to new db is complete
export async function migration() {
	await secretsToSSM();

  // LEGACY
	await packs1To2();
	await addBestRarityFound();
	await designs1To2();
	await cardTradeHistoryFlipToFrom();
	await instances1To2();
}
