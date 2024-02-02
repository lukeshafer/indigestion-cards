import { setAdminEnvSession } from "@lil-indigestion-cards/core/lib/session";
import { createApiRoute } from "../../../../site/src/lib/action"
import { updateFaq } from '@lil-indigestion-cards/core/lib/site-config';

export const POST = createApiRoute({
  schema: {
    content: 'string',
  },
  authorizationType: 'admin',
}, async ({ content }, ctx) => {
  setAdminEnvSession(
    ctx.locals.session?.properties.username || 'admin',
    ctx.locals.session?.properties.userId || 'admin'
  );

  await updateFaq(content);

  return ctx.redirect('/faq?alert=Updated FAQ')
})
