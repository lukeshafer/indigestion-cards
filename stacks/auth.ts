import { type StackContext, use } from 'sst/constructs';
import { Auth as SSTAuth } from 'sst/constructs/future';
import { Events } from './events';
import { ConfigStack } from './config';
import { Database } from './database';

export function Auth({ stack }: StackContext) {
  const config = use(ConfigStack);
  const db = use(Database);
  const { eventBus } = use(Events);

  const siteAuth = new SSTAuth(stack, 'AdminSiteAuth', {
    authenticator: {
      handler: 'packages/functions/src/auth.handler',
      bind: [
        config.TWITCH_CLIENT_ID,
        config.TWITCH_CLIENT_SECRET,
        db,
        config.STREAMER_USER_ID,
        config.TWITCH_TOKENS_PARAM,
        config.DOMAIN_NAME,
        eventBus,
      ],
      permissions: ['ssm:GetParameter', 'ssm:PutParameter'],
      runtime: 'nodejs18.x',
    },
  });

  stack.addOutputs({
    authEndpoint: siteAuth.url,
  });

  return {
    siteAuth,
  };
}
