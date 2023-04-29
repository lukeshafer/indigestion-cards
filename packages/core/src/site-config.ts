import { db, twitchEventTypes } from './db';
import type { CreateEntityItem } from 'electrodb';

type TwitchEvent = typeof db.entities.twitchEvents;

export async function batchTwitchEvents(options: { events: CreateEntityItem<TwitchEvent>[] }) {
	const results = options.events.map(async (event) => {
		const existingEvent = await db.entities.twitchEvents
			.get({ eventId: event.eventId })
			.go()
			.catch(() => null);

		if (existingEvent?.data) {
			if (event.packTypeId) {
				return db.entities.twitchEvents
					.update({ eventId: event.eventId })
					.set({
						packTypeId: event.packTypeId,
						packTypeName: event.packTypeName,
						cost: event.cost,
					})
					.go();
			}
			return db.entities.twitchEvents.delete({ eventId: event.eventId }).go();
		}
		if (event.packTypeId) {
			return db.entities.twitchEvents.create(event).go();
		}

		return null;
	});

	return await Promise.all(results);
}

export async function getTwitchEvents() {
	return await db.entities.twitchEvents.query.allTwitchEvents({}).go();
}

export function checkIsValidTwitchEventType(
	eventType: string
): eventType is (typeof twitchEventTypes)[number] {
	return twitchEventTypes.some((type) => type === eventType);
}
