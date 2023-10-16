import { config } from '../db/_utils';
import { cardInstances } from '../db/cardInstances';
import { users } from '../db/users';
import { Service } from 'electrodb';
import { getUser } from './user';

const service = new Service(
	{
		cardInstances,
		users,
	},
	config
);

export async function deleteCardInstanceById(args: { designId: string; instanceId: string }) {
	const {
		data: [card],
	} = await cardInstances.query.byId(args).go();
	if (!card) throw new Error('Card not found');
	const user = card.userId ? await getUser(card.userId) : null;

	if (user) {
		const result = await service.transaction
			.write(({ cardInstances, users }) => [
				cardInstances.delete(args).commit(),
				users
					.patch({ userId: user.userId })
					.set({ cardCount: (user.cardCount || 1) - 1 })
					.commit(),
			])
			.go();
		return result.data;
	}

	const result = await cardInstances.delete(args).go();
	return result.data;
}

export async function getCardInstanceById(args: { instanceId: string; designId: string }) {
	const result = await cardInstances.query.byId(args).go();
	return result.data[0];
}
