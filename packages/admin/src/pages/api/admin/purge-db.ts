import { db } from '@core/db';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const firstInput = formData.get('first-input') as string;
  const secondInput = formData.get('second-input') as string;

  const code1 = 'I want to delete everything in the database.';
  const code2 = "I'm SURE!!";

  if (firstInput !== code1 || secondInput !== code2) {
    console.error('Invalid code');
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await Promise.all([
    ...(await deleteEntity(db.entities.CardDesigns)),
    ...(await deleteEntity(db.entities.CardInstances)),
    ...(await deleteEntity(db.entities.MomentRedemptions)),
    ...(await deleteEntity(db.entities.Packs)),
    ...(await deleteEntity(db.entities.PackTypes)),
    ...(await deleteEntity(db.entities.Preorders)),
    ...(await deleteEntity(db.entities.Rarities)),
    ...(await deleteEntity(db.entities.Seasons)),
    ...(await deleteEntity(db.entities.Trades)),
    ...(await deleteEntity(db.entities.TwitchEventMessageHistory)),
    ...(await deleteEntity(db.entities.TwitchEvents)),
    ...(await deleteEntity(db.entities.UnmatchedImages)),
    ...(await deleteEntity(db.entities.Users)),
    ...(await deleteEntity(db.entities.UserLogins)),
  ]);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

type EntityName = keyof Omit<(typeof db)['entities'], 'admins'>;
type Entity = (typeof db)['entities'][EntityName];

async function deleteEntity(entity: Entity) {
  // @ts-expect-error - Entity Type is funky :(
  const entityData = await entity.scan.go({ pages: 'all' });
  const deleteResults = entityData.data.map(
    // @ts-expect-error - inherited from above
    async (item) =>
      await entity
        // @ts-expect-error - All entities will have a delete method
        .delete(item)
        .go()
  );
  return deleteResults;
}
