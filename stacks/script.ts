import { type StackContext, use, Script } from 'sst/constructs';
import { Database } from './database';
import { ConfigStack } from './config';

export function AfterDeployStack({ stack }: StackContext) {
	const db = use(Database);
	const config = use(ConfigStack);

	new Script(stack, 'RefactorFn', {
		onCreate: {
			handler: 'packages/functions/src/deployment/mega-refactor-migration.handler',
			bind: [db],
		},
	});

	const script = new Script(stack, 'AfterDeployScript', {
		onCreate: 'packages/functions/src/deployment/seed-db.handler',
		onDelete: 'packages/functions/src/deployment/delete-twitch-events.handler',
		onUpdate: 'packages/functions/src/deployment/migrate-db.handler',
		defaults: {
			function: {
				bind: [
					db,
					config.TWITCH_CLIENT_ID,
					config.TWITCH_CLIENT_SECRET,
					config.TWITCH_TOKENS_PARAM,
					config.STREAMER_USER_ID,
				],
				permissions: ['ssm:GetParameter', 'ssm:PutParameter'],
				runtime: 'nodejs18.x',
			},
		},
	});

	return script;
}
