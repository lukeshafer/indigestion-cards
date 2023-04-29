import { db, twitchEventTypes } from './db'
import type { CreateEntityItem } from 'electrodb'

type TwitchEvent = typeof db.entities.twitchEvents

export async function createTwitchEvent(options: CreateEntityItem<TwitchEvent>) {
	const result = await db.entities.twitchEvents.create(options).go()
	return result.data
}

export function checkIsValidTwitchEventType(
	eventType: string
): eventType is (typeof twitchEventTypes)[number] {
	return twitchEventTypes.some((type) => type === eventType)
}
