import { db } from './db'
import type { EntityItem, CreateEntityItem } from 'electrodb'
import { ElectroError } from 'electrodb'

type Result<T> =
	| {
		success: true
		data: T
	}
	| {
		success: false
		error: string
	}

type CardDesign = typeof db.entities.cardDesigns
type Card = typeof db.entities.cardInstances
type Season = typeof db.entities.season
type UnmatchedImage = typeof db.entities.unmatchedImages
type Pack = typeof db.entities.packs
type Rarity = typeof db.entities.rarities

export type CardDesignEntity = EntityItem<CardDesign>

export async function generateCard(info: {
	seasonId: string
	userId: string
	username: string
	packId: string | undefined
}) {
	// Steps:
	// 1. Get a random card design from the season
	// 2. Get all existing instances of that card design
	// 3. Generate a rarity for the card
	// 4. Generate a unique instanceId for the card
	// 5. Create the card instance

	const seasonAndDesigns = await db.collections
		.designAndCards(info)
		.where((attr, op) => op.ne(attr.isComplete, true))
		.go()
	const cardDesigns = seasonAndDesigns.data.cardDesigns
	const existingInstances = seasonAndDesigns.data.cardInstances

	if (cardDesigns.length === 0) {
		throw new Error('No designs found')
	}

	const design = cardDesigns[Math.floor(Math.random() * cardDesigns.length)]

	if (!design.rarityDetails) {
		throw new Error('No rarity details found')
	}

	const rarityMap = new Map(
		design.rarityDetails.map(({ rarityName, rarityId, count, frameUrl }) => [
			rarityId,
			{ rarityName, rarityId, max: count, count: 0, frameUrl },
		])
	)

	existingInstances.forEach((instance) => {
		const rarityDetails = rarityMap.get(instance.rarityId)
		if (!rarityDetails) return
		const newCount = rarityDetails.count + 1
		if (rarityDetails.max - newCount === 0) rarityMap.delete(instance.rarityId)
		else rarityMap.set(instance.rarityId, { ...rarityDetails, count: newCount })
	})

	const rarityList: string[] = []
	rarityMap.forEach(({ max, count }, rarity) => {
		for (let i = 0; i < max - count; i++) {
			rarityList.push(rarity)
		}
	})

	const assignedRarityId = rarityList[Math.floor(Math.random() * rarityList.length)]
	const instanceId = `${info.seasonId}-${design.designId}-${assignedRarityId}-${(rarityMap.get(assignedRarityId)?.count ?? 0) + 1
		}`

	const assignedRarity = rarityMap.get(assignedRarityId)!

	const result = await db.entities.cardInstances
		.create({
			seasonId: info.seasonId,
			designId: design.designId,
			rarityId: assignedRarityId,
			rarityName: assignedRarity.rarityName,
			frameUrl: assignedRarity.frameUrl,
			instanceId,
			username: info.username,
			userId: info.userId,
			minterId: info.userId,
			minterUsername: info.username,
			openedAt: info.packId ? undefined : new Date().toISOString(),
			packId: info.packId,
		})
		.go()
		.catch((err) => {
			console.log(err)
			throw err
		})

	return result.data
}

export async function deleteCardInstanceById(args: { instanceId: string }) {
	const result = await db.entities.cardInstances.delete({ instanceId: args.instanceId }).go()
	return result.data
}

export async function deletePack(args: { packId: string }) {
	const pack = await db.collections.packsAndCards({ packId: args.packId }).go()
	const instanceDeleteResult = await Promise.allSettled(
		pack.data.cardInstances.map((card) => {
			return db.entities.cardInstances.delete({ instanceId: card.instanceId }).go()
		})
	)

	if (instanceDeleteResult.some((result) => result.status === 'rejected')) {
		throw new Error(
			'Failed to delete card instances - pack not deleted. \
			Please try again and report this issue if it persists.'
		)
	}

	const result = await db.entities.packs.delete({ packId: args.packId }).go()
	return result.data
}

export async function createPack(args: {
	userId: string
	username: string
	seasonId: string
	count: number
}) {
	const packId = `pack-${args.userId}-${new Date().toISOString()}-${Math.random()}`

	const cards = []
	for (let i = 0; i < args.count; i++) {
		const card = await generateCard({
			seasonId: args.seasonId,
			userId: args.userId,
			username: args.username,
			packId,
		})
		cards.push(card)
	}

	const pack = await db.entities.packs
		.create({
			packId,
			userId: args.userId,
			username: args.username,
			seasonId: args.seasonId,
			cardDetails: cards.map((card) => ({ instanceId: card.instanceId })),
		})
		.go()
}

export async function openCardFromPack(args: {
	instanceId: string
	designId: string
	seasonId: string
}) {
	const card = await db.entities.cardInstances.query.byDesignId(args).go()
	if (!card.data || card.data.length === 0) {
		throw new Error('Card not found')
	}
	if (card.data[0].openedAt && card.data[0].packId) {
		throw new Error('Card already opened')
	}
	const result = await db.entities.cardInstances
		.update({
			...card.data[0],
		})
		.set({ openedAt: new Date().toISOString(), packId: undefined })
		.go()
	return result.data
}

// DESIGN //
export async function getAllCardDesigns() {
	const result = await db.entities.cardDesigns.query.allDesigns({}).go()
	return result.data
}

export async function getCardDesignById(args: { designId: string; seasonId: string }) {
	const result = await db.entities.cardDesigns.query.byDesignId(args).go()
	return result.data[0]
}

export async function getCardDesignAndInstancesById(args: { designId: string; seasonId: string }) {
	const result = await db.collections.designAndCards(args).go()
	return result.data
}

export async function deleteCardDesignById(args: { designId: string; seasonId: string }) {
	const design = await getCardDesignAndInstancesById(args)
	if (design.cardInstances.length > 0)
		return {
			success: false,
			error: 'Cannot delete design with existing instances',
		}

	const result = await db.entities.cardDesigns.delete(args).go()

	return { success: true, data: result.data }
}

export async function createCardDesign(
	card: CreateEntityItem<CardDesign>
): Promise<Result<CardDesignEntity>> {
	try {
		const result = await db.entities.cardDesigns.create({ ...card }).go()
		return { success: true, data: result.data }
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` }

		if (err.code === 4001)
			// aws error, design already exists
			return {
				success: false,
				error: 'Design already exists',
			}

		// default
		return {
			success: false,
			error: err.message,
		}
	}
}

// UNMATCHED DESIGN IMAGES //
export async function getUnmatchedDesignImages(type?: EntityItem<UnmatchedImage>['type']) {
	if (type) {
		const result = await db.entities.unmatchedImages.query.byType({ type }).go()
		return result.data
	}

	const result = await db.entities.unmatchedImages.query.allImages({}).go()
	return result.data
}

export async function createUnmatchedDesignImage(image: CreateEntityItem<UnmatchedImage>) {
	const result = await db.entities.unmatchedImages.create(image).go()
	return result.data
}

export async function deleteUnmatchedDesignImage(id: string) {
	console.log('deleting unmatched image', id)
	const result = await db.entities.unmatchedImages.delete({ imageId: id }).go()
	return result.data
}

// SEASONS //
export async function getAllSeasons() {
	const result = await db.entities.season.query.allSeasons({}).go()
	return result.data
}

export async function getSeasonById(id: string) {
	const result = await db.entities.season.query.bySeasonId({ seasonId: id }).go()
	return result.data[0]
}

export async function getSeasonAndDesignsBySeasonId(id: string) {
	const result = await db.collections.seasonAndDesigns({ seasonId: id }).go()
	return result.data
}

export async function deleteSeasonById(id: string): Promise<Result<EntityItem<Season>>> {
	const seasonData = await getSeasonAndDesignsBySeasonId(id)
	if (seasonData.cardDesigns.length > 0)
		return {
			success: false,
			error: 'Cannot delete season with existing designs',
		}

	const result = await db.entities.season.delete({ seasonId: id }).go()
	return { success: true, data: result.data }
}

export async function createSeason(
	season: CreateEntityItem<Season>
): Promise<Result<EntityItem<Season>>> {
	try {
		const result = await db.entities.season.create({ ...season }).go()
		return {
			success: true,
			data: result.data,
		}
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` }

		if (err.code === 4001)
			// aws error, season already exists
			return {
				success: false,
				error: 'Season already exists',
			}

		// default
		return {
			success: false,
			error: err.message,
		}
	}
}

// RARITIES //
export async function getRarityById(args: { rarityId: string }) {
	const result = await db.entities.rarities.query.allRarities(args).go()
	return result.data[0]
}

export async function getAllRarities() {
	const result = await db.entities.rarities.query.allRarities({}).go()
	return result.data
}

export async function createRarity(
	rarity: CreateEntityItem<Rarity>
): Promise<Result<EntityItem<Rarity>>> {
	try {
		const result = await db.entities.rarities.create(rarity).go()
		return { success: true, data: result.data }
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` }

		if (err.code === 4001)
			// aws error, rarity already exists
			return {
				success: false,
				error: 'Rarity already exists',
			}

		// default
		return {
			success: false,
			error: err.message,
		}
	}
}

export async function deleteRarityById(id: string): Promise<Result<EntityItem<Rarity>>> {
	const allDesigns = await db.entities.cardDesigns.query.allDesigns({}).go()
	const designsWithRarity = allDesigns.data.some((design) =>
		design.rarityDetails?.some((r) => r.rarityId === id)
	)
	if (designsWithRarity) {
		return {
			success: false,
			error: 'Cannot delete rarity with existing designs',
		}
	}

	const result = await db.entities.rarities.delete({ rarityId: id }).go()
	return { success: true, data: result.data }
}
