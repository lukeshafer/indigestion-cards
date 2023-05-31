import { type StackContext, use, Script } from 'sst/constructs';
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
					config.APP_ACCESS_TOKEN_ARN,
				],
				permissions: ['secretsmanager:GetSecretValue', 'secretsmanager:PutSecretValue'],
			},
		},
	});

	return script;
}
