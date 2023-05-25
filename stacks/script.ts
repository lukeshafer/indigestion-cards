import { type StackContext, dependsOn, use, Script } from 'sst/constructs';
import { Database } from './database';
import { ConfigStack } from './config';

export function AfterDeployStack({ stack }: StackContext) {
	const db = use(Database);
	const config = use(ConfigStack);

	const script = new Script(stack, 'AfterDeployScript', {
		onCreate: 'packages/functions/src/deployment/seed-db.handler',
		defaults: {
			function: {
				bind: [
					db,
					config.TWITCH_CLIENT_ID,
					config.TWITCH_CLIENT_SECRET,
					config.TWITCH_ACCESS_TOKEN,
				],
			},
		},
	});
}
