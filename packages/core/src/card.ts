import { db } from './db'
import type { EntityItem, CreateEntityItem } from 'electrodb'
import { ElectroError } from 'electrodb'

type CardDesign = typeof db.entities.cardDesigns
type Card = typeof db.entities.cardInstances
type Series = typeof db.entities.cardSeries

export async function generateCard(info: {
	seriesId: string
	userId: string
	username: string
	packId: string | undefined
}) {
	// Steps:
	// 1. Get a random card design from the series
	// 2. Get all existing instances of that card design
	// 3. Generate a rarity for the card
	// 4. Generate a unique instanceId for the card
	// 5. Create the card instance

	const seriesAndDesigns = await db.collections
		.seriesAndDesigns(info)
		.where((attr, op) => op.ne(attr.isComplete, true))
		.go()
	const cardDesigns = seriesAndDesigns.data.cardDesigns

	if (cardDesigns.length === 0) {
		throw new Error('No designs found')
	}

	const design = cardDesigns[Math.floor(Math.random() * cardDesigns.length)]

	if (!design.rarityDetails) {
		throw new Error('No rarity details found')
	}

	const existingInstances = await db.entities.cardInstances.query
		.byDesignId({
			designId: design.designId,
		})
		.go()

	const rarities = design.rarityDetails.reduce(
		(acc, { rarityLevel, count }) =>
			acc.set(rarityLevel, { max: count, count: 0 }),
		new Map<string, { max: number; count: number }>()
	)

	existingInstances.data.forEach((instance) => {
		const rarity = instance.rarityLevel
		const details = rarities.get(rarity)
		if (!details) return
		const newCount = details.count + 1
		if (details.max - newCount === 0) rarities.delete(rarity)
		else rarities.set(rarity, { ...details, count: newCount })
	})

	const rarityList: string[] = []
	rarities.forEach(({ max, count }, rarity) => {
		for (let i = 0; i < max - count; i++) {
			rarityList.push(rarity)
		}
	})

	const rarityLevel = rarityList[Math.floor(Math.random() * rarityList.length)]
	const instanceId = `${info.seriesId}-${design.designId}-${rarityLevel}-${
		(rarities.get(rarityLevel)?.count ?? 0) + 1
	}`

	const result = await db.entities.cardInstances
		.create({
			seriesId: info.seriesId,
			designId: design.designId,
			rarityLevel,
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

export async function createPack(args: {
	userId: string
	username: string
	seriesId: string
	count: number
}) {
	const packId = `pack-${
		args.userId
	}-${new Date().toISOString()}-${Math.random()}`

	const cards = []
	for (let i = 0; i < args.count; i++) {
		const card = await generateCard({
			seriesId: args.seriesId,
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
			seriesId: args.seriesId,
			cardDetails: cards.map((card) => ({ instanceId: card.instanceId })),
		})
		.go()
}

export async function openCardFromPack(args: {
	instanceId: string
	designId: string
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

export async function getCardDesignById(id: string) {
	const result = await db.entities.cardDesigns.query
		.byDesignId({ designId: id })
		.go()
	return result.data[0]
}

export async function getCardDesignAndInstancesById(id: string) {
	const result = await db.collections.designsAndCards({ designId: id }).go()
	return result.data
}

export async function createCardDesign(
	card: CreateEntityItem<CardDesign>
): Promise<
	| {
			success: true
			data: EntityItem<CardDesign>
	  }
	| {
			success: false
			error: string
	  }
> {
	try {
		const result = await db.entities.cardDesigns.create({ ...card }).go()
		return { success: true, data: result.data }
	} catch (err) {
		if (!(err instanceof ElectroError))
			return { success: false, error: `${err}` }

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

// SERIES //
export async function getAllSeries() {
	const result = await db.entities.cardSeries.query.allSeries({}).go()
	return result.data
}

export async function getOnlySeriesById(id: string) {
	const result = await db.entities.cardSeries.query
		.bySeriesId({ seriesId: id })
		.go()
	return result.data[0]
}

export async function getSeriesAndDesignsBySeriesId(id: string) {
	const result = await db.collections.seriesAndDesigns({ seriesId: id }).go()
	return result.data
}

export async function createSeries(series: CreateEntityItem<Series>): Promise<
	| {
			success: true
			data: EntityItem<Series>
	  }
	| {
			success: false
			error: string
	  }
> {
	try {
		const result = await db.entities.cardSeries.create({ ...series }).go()
		return {
			success: true,
			data: result.data,
		}
	} catch (err) {
		if (!(err instanceof ElectroError))
			return { success: false, error: `${err}` }

		if (err.code === 4001)
			// aws error, series already exists
			return {
				success: false,
				error: 'Series already exists',
			}

		// default
		return {
			success: false,
			error: err.message,
		}
	}
}
