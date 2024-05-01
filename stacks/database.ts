import { StackContext, Table, Cron, use } from 'sst/constructs';
import { ConfigStack } from './config';

export function Database({ stack }: StackContext) {
  const config = use(ConfigStack);

  const table = new Table(stack, 'data', {
    fields: {
      pk: 'string',
      sk: 'string',
      gsi1pk: 'string',
      gsi1sk: 'string',
      gsi2pk: 'string',
      gsi2sk: 'string',
      gsi3pk: 'string',
      gsi3sk: 'string',
      gsi4pk: 'string',
      gsi4sk: 'string',
    },
    primaryIndex: {
      partitionKey: 'pk',
      sortKey: 'sk',
    },
    globalIndexes: {
      gsi1: {
        partitionKey: 'gsi1pk',
        sortKey: 'gsi1sk',
      },
      gsi2: {
        partitionKey: 'gsi2pk',
        sortKey: 'gsi2sk',
      },
      gsi3: {
        partitionKey: 'gsi3pk',
        sortKey: 'gsi3sk',
      },
      gsi4: {
        partitionKey: 'gsi4pk',
        sortKey: 'gsi4sk',
      },
    },
  });

  new Cron(stack, 'RefreshUsernamesCron', {
    schedule: 'cron(0 6 * * ? *)',
    job: {
      function: {
        handler: 'packages/functions/src/cron/refresh-usernames.handler',
        environment: {
          SESSION_USER_ID: 'RefreshUsernamesCron',
          SESSION_TYPE: 'admin',
          SESSION_USERNAME: 'Refresh Usernames Cron Job',
        },
        bind: [
          table,
          config.TWITCH_CLIENT_SECRET,
          config.TWITCH_CLIENT_ID,
          config.TWITCH_TOKENS_PARAM,
        ],
        permissions: ['ssm:GetParameter', 'ssm:PutParameter'],
        runtime: 'nodejs18.x',
      },
    },
  });

  new Cron(stack, 'RefreshUserCardCountsCron', {
    schedule: 'cron(10 6 * * ? *)',
    job: {
      function: {
        handler: 'packages/functions/src/cron/refresh-card-and-pack-count.handler',
        environment: {
          SESSION_USER_ID: 'RefreshUserCardCountsCron',
          SESSION_TYPE: 'admin',
          SESSION_USERNAME: 'Refresh User Card Counts Cron Job',
        },
        bind: [table],
        runtime: 'nodejs18.x',
      },
    },
  });

  return table;
}
