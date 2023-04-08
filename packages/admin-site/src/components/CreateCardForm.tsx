import { SetStoreFunction, createStore, reconcile } from 'solid-js/store'
import { For, createSignal } from 'solid-js'

interface Rarity {
	rarityLevel: string
	count: number
}

export default function CreateCardForm(props: {
	series: {
		seriesId: string
		seriesName: string
	}[]
}) {
	const [name, setName] = createSignal('')
	const [seriesId, setSeriesId] = createSignal('')
	const [description, setDescription] = createSignal('')
	const [artist, setArtist] = createSignal('')
	const [designId, setDesignId] = createSignal('')
	const [releaseDate, setReleaseDate] = createSignal('')
	const [rarities, setRarities] = createStore<Rarity[]>([])

	function submitForm() {
		const body = JSON.stringify({
			seriesId: seriesId(),
			cardName: name(),
			cardDescription: description(),
			artist: artist(),
			designId: designId(),
			releaseDate: releaseDate(),
			rarityDetails: rarities,
		})

		fetch(
			'https://1jrnx32g8i.execute-api.us-east-2.amazonaws.com/create-card-design',
			{
				method: 'POST',
				body,
			}
		)
	}

	return (
		<form
			class="flex flex-col items-start p-4 gap-4"
			id="create-card-design"
			method="post"
			onSubmit={(e) => {
				e.preventDefault()
				submitForm()
			}}
			action="https://1jrnx32g8i.execute-api.us-east-2.amazonaws.com/create-card-design">
			<select
				name="seriesId"
				id="seriesId"
				value={seriesId()}
				required
				onInput={(e) => setSeriesId(e.currentTarget.value)}>
				{props.series.map((series) => (
					<option value={series.seriesId}>{series.seriesName}</option>
				))}
			</select>
			<Input id="name" get={name} set={setName}>
				Name
			</Input>
			<Input id="description" get={description} set={setDescription}>
				Description
			</Input>
			<Input id="artist" get={artist} set={setArtist}>
				Artist
			</Input>
			<Input id="designId" get={designId} set={setDesignId}>
				Design ID
			</Input>
			<Input id="releaseDate" get={releaseDate} set={setReleaseDate}>
				Release Date
			</Input>

			<label for="rarityDetails">Rarity Details</label>
			<fieldset>
				<button
					onClick={(e) => {
						e.preventDefault()
						setRarities([...rarities, { rarityLevel: '', count: 0 }])
					}}>
					Add Rarity
				</button>
				<For each={rarities}>
					{(rarity, index) => (
						<Rarity
							{...rarity}
							index={index}
							rarities={rarities}
							setRarities={setRarities}
						/>
					)}
				</For>
				<button type="submit">Create</button>
			</fieldset>
		</form>
	)
}

function Input<T extends string | number | string[]>(props: {
	id: string
	get: () => T
	set: (value: string) => void
	type?: 'string' | 'number'
	children: string
}) {
	return (
		<div>
			<label for={props.id}>{props.children}</label>
			<input
				class="block"
				id={props.id}
				name={props.id}
				type={props.type ?? 'string'}
				value={props.get()}
				onInput={(e) => {
					props.set(e.currentTarget.value)
				}}
				required
			/>
		</div>
	)
}

function Rarity(
	props: Rarity & {
		index: () => number
		rarities: Rarity[]
		setRarities: SetStoreFunction<Rarity[]>
	}
) {
	return (
		<div>
			<label for={`rarityLevel-${props.index()}`}>Rarity Level</label>
			<input
				type="text"
				name={`rarityLevel-${props.index()}`}
				id={`rarityLevel-${props.index()}`}
				value={props.rarityLevel}
				onInput={(e) =>
					props.setRarities(props.index(), {
						rarityLevel: e.currentTarget.value,
						count: props.count,
					})
				}
				required
			/>
			<label for={`count-${props.index()}`}>Count</label>
			<input
				type="number"
				name={`count-${props.index()}`}
				id={`count-${props.index()}`}
				value={props.count}
				onInput={(e) =>
					props.setRarities(props.index(), {
						rarityLevel: props.rarityLevel,
						count: Number(e.currentTarget.value),
					})
				}
				required
			/>
			<button
				onClick={() => {
					const newRarities = props.rarities.slice()
					props.rarities.splice(props.index(), 1)
					props.setRarities(reconcile(newRarities))
				}}>
				Remove
			</button>
		</div>
	)
}
