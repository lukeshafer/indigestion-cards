import { ApiHandler, useFormValue } from 'sst/node/api';
import { useSession } from 'sst/node/future/auth';
import { db } from '@lil-indigestion-cards/core/db/db-service';
import { setAdminEnvSession } from '@lib/session';

export const handler = ApiHandler(async () => {
	const session = useSession();
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
		...(await deleteEntity(db.entities.cardInstances)),
		...(await deleteEntity(db.entities.packs)),
		...(await deleteEntity(db.entities.packTypes)),
		...(await deleteEntity(db.entities.cardDesigns)),
		...(await deleteEntity(db.entities.season)),
		...(await deleteEntity(db.entities.rarities)),
		...(await deleteEntity(db.entities.unmatchedImages)),
		...(await deleteEntity(db.entities.twitchEvents)),
		...(await deleteEntity(db.entities.twitchEventMessageHistory)),
		...(await deleteEntity(db.entities.users)),
	]);

	return {
		statusCode: 200,
		body: JSON.stringify(result),
	};
});

type EntityName = keyof Omit<(typeof db)['entities'], 'admins'>;
type Entity = (typeof db)['entities'][EntityName];

async function deleteEntity(entity: Entity) {
	const entityData = await entity.scan.go();
	const deleteResults = entityData.data.map(
		async (item) =>
			await entity
				// @ts-expect-error - All entities will have a delete method
				.delete(item)
				.go()
	);
	return deleteResults;
}
