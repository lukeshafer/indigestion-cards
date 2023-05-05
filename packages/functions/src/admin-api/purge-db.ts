import { ApiHandler, useFormValue } from 'sst/node/api';
import { useSession } from 'sst/node/future/auth';
import { db } from '@lil-indigestion-cards/core/db';

export const handler = ApiHandler(async () => {
	const session = useSession();
	if (session.type !== 'admin') {
		return {
			statusCode: 401,
			body: 'Unauthorized',
		};
	}

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
	]);

	return {
		statusCode: 200,
		body: JSON.stringify(result),
	};
});

type EntityName = keyof Omit<(typeof db)['entities'], 'users' | 'admins'>;
type Entity = (typeof db)['entities'][EntityName];

async function deleteEntity(entity: Entity) {
	const entityData = await entity.scan.go();
	const deleteResults = entityData.data.map(async (item) => await entity.delete(item).go());
	return deleteResults;
}
