import { ElectroError } from 'electrodb';
import { preorders, type CreatePreorder } from '../db/preorders';

export async function createPreorder(args: CreatePreorder) {
	console.log('Creating preorder', args);

	try {
		const result = await preorders.create(args).go();
		return { success: true, data: result.data };
	} catch (err) {
		console.error('Error creating preorder', err);
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` };

		if (err.code === 4001)
			// aws error, rarity already exists
			return {
				success: false,
				error: 'Rarity already exists',
			};

		// default
		return {
			success: false,
			error: err.message,
		};
	}
}

export async function getAllPreorders() {
	console.log('Getting all preorders');

	const result = await preorders.query.primary({}).go();
	return result.data.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
}

export async function getPreordersByUser(args: { username: string }) {
	console.log('Getting preorders by user', args);

	const result = await preorders.query.primary(args).go();
	return result.data;
}
