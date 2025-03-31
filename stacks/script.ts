import { type StackContext, use, Script } from 'sst/constructs';
import { Database } from './database';
import { ConfigStack } from './config';
import { DataRecoveryBucket } from './bucket';
import * as iam from 'aws-cdk-lib/aws-iam';

export function AfterDeployStack({ app, stack }: StackContext) {
	const { table } = use(Database);
	const config = use(ConfigStack);
	const { dataRecoveryBucket } = use(DataRecoveryBucket);

	const backupTableName = 'prod-indigestion-cards-restore-20240511-203500';

	const script = new Script(stack, 'AfterDeployScript', {
		onCreate: 'packages/functions/src/deployment/seed-db.handler',
		onDelete: 'packages/functions/src/deployment/delete-twitch-events.handler',
		onUpdate: 'packages/functions/src/deployment/migrate-db.handler',
		defaults: {
			function: {
				environment: {
					BACKUP_TABLE_NAME: app.mode === 'dev' ? 'dev mode' : backupTableName,
				},
				bind: [
					table,
					config.TWITCH_CLIENT_ID,
					config.TWITCH_CLIENT_SECRET,
					config.TWITCH_TOKENS_PARAM,
					config.STREAMER_USER_ID,
					dataRecoveryBucket,
				],
				permissions: ['ssm:GetParameter', 'ssm:PutParameter'],
				runtime: 'nodejs22.x',
			},
		},
	});

	if (app.mode !== 'dev') {
		script.attachPermissions([
			new iam.PolicyStatement({
				actions: ['dynamodb:Scan'],
				effect: iam.Effect.ALLOW,
				resources: [
					`arn:aws:dynamodb:${app.region}:${app.account}:table/${backupTableName}`,
				],
			}),
		]);
	}

	return script;
}
