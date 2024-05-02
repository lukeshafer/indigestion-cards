import { setAdminEnvSession } from "@core/lib/session";
import { createApiRoute } from "@site/lib/action"
import { updateFaq } from '@core/lib/site-config';

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
