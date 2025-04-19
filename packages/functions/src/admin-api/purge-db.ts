import { ApiHandler, useCookie, useFormValue } from 'sstv2/node/api';
import { db } from '../../../core/src/db';
import { setAdminEnvSession } from '@core/lib/session';
import { COOKIE, useSession } from '@core/lib/auth';

export const handler = ApiHandler(async () => {
	const session = await useSession({
    access: useCookie(COOKIE.ACCESS),
    refresh: useCookie(COOKIE.REFRESH),
  });

	if (session.type !== 'admin') {
		return {
			statusCode: 401,
			body: 'Unauthorized',
		};
	}
	setAdminEnvSession(session.properties.username, session.properties.userId);

	const firstInput = useFormValue('first-input');
	const secondInput = useFormValue('second-input');

	const code1 = 'I want to delete everything in the database.';
	const code2 = "I'm SURE!!";

	if (firstInput !== code1 || secondInput !== code2) {
		console.error('Invalid code');
		return {
			statusCode: 401,
			body: 'Unauthorized',
		};
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

	return {
		statusCode: 200,
		body: JSON.stringify(result),
	};
});

type EntityName = keyof Omit<(typeof db)['entities'], 'admins'>;
type Entity = (typeof db)['entities'][EntityName];

async function deleteEntity(entity: Entity) {
	const entityData = await entity.scan.go({ pages: 'all' });
	const deleteResults = entityData.data.map(
		async item =>
			await entity
				// @ts-expect-error - All entities will have a delete method
				.delete(item)
				.go()
	);
	return deleteResults;
}
