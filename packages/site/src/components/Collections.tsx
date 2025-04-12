import type * as DB from '@core/types';
import { trpc } from '@site/client/api';
import * as Solid from 'solid-js';
import { Checkbox, Fieldset, NumberInput, SubmitButton, TextInput } from '@site/components/Form';
import { CardEls, cardUtils, FULL_ART_BACKGROUND_CSS } from '@site/components/Card';
import { FULL_ART_ID, routes } from '@site/constants';
import { createMutable, createStore, produce, reconcile } from 'solid-js/store';
import { ReactiveSet } from '@solid-primitives/set';
import * as CardList from './CardList';

const CollectionContext = Solid.createContext<{
	seasons: Map<
		string,
		{
			season: DB.Season;
			cards: Array<DB.CardDesign>;
		}
	>;
}>({
	seasons: new Map(),
});
function useCollectionContext() {
	return Solid.useContext(CollectionContext);
}

export const CollectionBuilder: Solid.Component<{ cards: Array<DB.CardInstance> }> = props => {
	const [state, setState] = createStore({
		type: 'rule' as 'set' | 'rule', // FIXME:
		rules: {} as DB.CollectionRules,
		cards: [] as DB.CollectionCards,
		previewCards: [] as Array<DB.CardInstance>,
		collectionName: '',
	});

	Solid.createEffect(
		Solid.on(
			() => state.type,
			type => {
				if (type === 'set') {
					let previewCards = state.previewCards;
					if (previewCards.length > 0) {
						setState(
							'cards',
							previewCards.map(c => ({
								designId: c.designId,
								instanceId: c.instanceId,
							}))
						);
					}
					setState('rules', reconcile({}));
				} else if (type === 'rule') {
					setState('cards', []);
				}
			}
		)
	);

	Solid.createEffect(
		Solid.on(
			() => ({
				type: state.type,
				rules: { ...state.rules },
				cards: [...state.cards.map(card => ({ ...card }))],
			}),
			({ type, rules, cards }) => {
				switch (type) {
					case 'set':
						if (cards.length === 0) {
							setState('previewCards', []);
						} else {
							trpc.collections.mockLoadCardsSet
								.query({ cards })
								.then(result => setState('previewCards', reconcile(result)));
						}
						break;
					case 'rule':
						if (checkAreRulesEmpty(rules)) {
							setState('previewCards', []);
						} else {
              console.log(rules.artists)
							trpc.collections.mockLoadCardsRule
								.query(rules)
								.then(result => setState('previewCards', reconcile(result)));
						}
						break;
				}
			}
		)
	);

	const [seasons] = Solid.createResource(
		async () =>
			new Map(
				await trpc.seasons.getAllWithDesigns
					.query()
					.then(data =>
						data.sort(([a], [b]) =>
							a.toLowerCase().startsWith('moment')
								? 1
								: b.toLowerCase().startsWith('moment')
									? -1
									: a.localeCompare(b)
						)
					)
			),
		{ initialValue: new Map() }
	);

	// Solid.onMount(() => {
	// 	window.addEventListener('beforeunload', e => {
	// 		if (state.previewCards.length > 0 && !confirm()) {
	// 			// e.preventDefault();
	// 		}
	// 	});
	// });

	return (
		<CollectionContext.Provider
			value={{
				get seasons() {
					return seasons.latest;
				},
			}}>
			<div class="grid gap-y-8 lg:grid-cols-[60%_40%]">
				<div class="grid h-fit gap-8">
					<fieldset class="flex justify-center">
						<label
							class="data-[checked=true]:bg-brand-light dark:data-[checked=true]:bg-brand-main focus-within:outline-brand-main flex w-full max-w-60 cursor-pointer justify-end gap-2 rounded-l-full bg-gray-200 px-2 text-right font-light text-gray-500 focus-within:z-10 focus-within:outline data-[checked=true]:font-semibold data-[checked=true]:text-black dark:bg-gray-800 dark:font-light dark:data-[checked=true]:font-semibold"
							data-checked={state.type === 'set'}>
							<input
								type="radio"
								name="collectionType"
								value="set"
								class="sr-only"
								checked={state.type === 'set'}
								onChange={() => {
									if (state.type === 'set') return;
									if (
										state.previewCards.length === 0 ||
										confirm(
											'Are you sure you want to change type? Cards selected by filter will transfer.'
										)
									) {
										setState('type', 'set');
									}
								}}
							/>
							<p>Standard Collection</p>
						</label>
						<label
							class="data-[checked=true]:bg-brand-light dark:data-[checked=true]:bg-brand-main focus-within:outline-brand-main flex w-full max-w-60 cursor-pointer justify-start gap-2 rounded-r-full bg-gray-200 px-2 font-light text-gray-500 focus-within:outline data-[checked=true]:font-semibold data-[checked=true]:text-black dark:bg-gray-800 dark:font-light dark:data-[checked=true]:font-semibold"
							data-checked={state.type === 'rule'}>
							<input
								type="radio"
								name="collectionType"
								value="rule"
								class="sr-only"
								checked={state.type === 'rule'}
								onChange={() => {
									if (state.type === 'rule') return;
									if (
										state.previewCards.length === 0 ||
										confirm(
											'Are you sure you want to change type? You will start over with no cards selected.'
										)
									) {
										setState('type', 'rule');
									}
								}}
							/>
							<p>Advanced Collection</p>
						</label>
					</fieldset>
					<Solid.Switch>
						<Solid.Match when={state.type === 'set'}>
							<SetCollectionBuilder
								userCards={props.cards}
								selectedCards={state.cards}
								addCardId={instanceId => {
									if (state.cards.some(card => card.instanceId === instanceId))
										return;

									const card = props.cards.find(
										card => card.instanceId === instanceId
									);

									if (!card) return;

									setState('cards', state.cards.length, {
										designId: card.designId,
										instanceId: card.instanceId,
									});
								}}
								removeCardId={instanceId => {
									let indexes = state.cards.reduce((indexes, value, index) => {
										if (value.instanceId === instanceId) {
											return [...indexes, index];
										} else return indexes;
									}, [] as Array<number>);

									if (indexes.length === 0) return;

									setState(
										'cards',
										produce(draft =>
											indexes.forEach(index => draft.splice(index, 1))
										)
									);
								}}
							/>
						</Solid.Match>
						<Solid.Match when={state.type === 'rule'}>
							<RuleCollectionBuilder setRules={rules => setState('rules', rules)} />
						</Solid.Match>
					</Solid.Switch>
				</div>
				<form class="grid h-fit gap-4 px-4">
					<div class="max-w-72">
						<TextInput
							maxLength="50"
							name="collectionName"
							label="Collection Name"
							setValue={v => setState('collectionName', v)}
						/>
					</div>
					<SubmitButton
						onClick={() => {
							trpc.collections.create
								.mutate({
									collectionName: state.collectionName,
									collectionType: state.type,
									collectionRules: state.type === 'rule' ? state.rules : {},
									collectionCards: state.type === 'set' ? state.cards : [],
								})
								.catch(error => {
									// TODO: handle the error
									console.error(error);
								})
								.then(result => {
									location.assign(
										`${routes.USERS}/${result?.username}?alert=Successfully%20created%20collection`
									);
								});
						}}
						disabled={
							state.previewCards.length === 0 || state.collectionName.length === 0
						}>
						<div class="w-fit">Save Collection</div>
					</SubmitButton>
					<CollectionCardsPreviewList cards={state.previewCards} type={state.type} />
				</form>
			</div>
		</CollectionContext.Provider>
	);
};

const CollectionCardsPreviewList: Solid.Component<{
	cards: Array<DB.CardInstance>;
	type: 'set' | 'rule';
}> = props => {
	return (
		<section aria-labelledby="collection-preview-title" class="mt-8">
			<h2 id="collection-preview-title" class="text-xl">
				Preview
			</h2>
			<ul
				class="grid h-fit w-full flex-wrap justify-center gap-4 p-4"
				style={{ 'grid-template-columns': 'repeat(auto-fill, minmax(8rem, 1fr))' }}>
				<Solid.Suspense fallback={<p>Loading</p>}>
					<Solid.For
						each={props.cards}
						fallback={
							<p class="col-span-full my-8 w-full text-center opacity-50">
								{props.type === 'set'
									? 'Collection is empty.'
									: 'Please select a filter to preview your collection.'}
							</p>
						}>
						{card => (
							<li
								draggable={props.type === 'set'}
								classList={{ 'cursor-pointer': props.type === 'set' }}>
								<PreviewCard card={card} />
							</li>
						)}
					</Solid.For>
				</Solid.Suspense>
			</ul>
		</section>
	);
};

const SetCollectionBuilder: Solid.Component<{
	userCards: Array<DB.CardInstance>;
	selectedCards: DB.CollectionCards;
	addCardId: (card: string) => void;
	removeCardId: (card: string) => void;
}> = props => {
	const [cards, state] = CardList.createCardList(() => props.userCards);

	return (
		<div class="flex flex-wrap gap-4">
			<CardList.CardListSearch setSearchText={state.setSearchText} />
			<CardList.CardList cards={cards()} scale={0.5}>
				{card => (
					<CardCheckbox
						checked={props.selectedCards.some(
							selectedCard => selectedCard.instanceId === card.instanceId
						)}
						name="cards"
						value={card.instanceId}
						onInput={e => {
							if (e.currentTarget.checked) props.addCardId(card.instanceId);
							else props.removeCardId(card.instanceId);
						}}>
						<InstanceCard card={card} />
					</CardCheckbox>
				)}
			</CardList.CardList>
		</div>
	);
};

const RuleContext = Solid.createContext({
	cardDesignIds: new ReactiveSet<string>(),
	cardNumbers: new ReactiveSet<number>(),
	cardDenominators: new ReactiveSet<number>(),
	seasonIds: new ReactiveSet<string>(),
	stamps: new ReactiveSet<string>(),
	tags: new ReactiveSet<string>(),
	rarityIds: new ReactiveSet<string>(),
	mintedByIds: new ReactiveSet<string>(),
	isMinter: undefined as boolean | undefined,
	artists: new ReactiveSet<string>(),
});
const useRules = () => Solid.useContext(RuleContext);

const RuleCollectionBuilder: Solid.Component<{
	setRules: (rules: DB.CollectionRules) => void;
}> = props => {
	const rules = createMutable(RuleContext.defaultValue);

	Solid.createEffect(() => {
		props.setRules({
			cardDesignIds: rules.cardDesignIds.size ? [...rules.cardDesignIds] : undefined,
			cardNumbers: rules.cardNumbers.size ? [...rules.cardNumbers] : undefined,
			cardDenominators: rules.cardDenominators.size ? [...rules.cardDenominators] : undefined,
			seasonIds: rules.seasonIds.size ? [...rules.seasonIds] : undefined,
			stamps: rules.stamps.size ? [...rules.stamps] : undefined,
			tags: rules.tags.size ? [...rules.tags] : undefined,
			rarityIds: rules.rarityIds.size ? [...rules.rarityIds] : undefined,
			mintedByIds: rules.mintedByIds.size ? [...rules.mintedByIds] : undefined,
			isMinter: rules.isMinter,
      artists: rules.artists.size ? [...rules.artists] : undefined,
    });
	});

	return (
		<RuleContext.Provider value={rules}>
			<form class="grid h-fit gap-2" onSubmit={e => e.preventDefault()}>
				<RuleCollectionBuilderDesignInput  />
				<Fieldset legend="Stamped">
					<Checkbox
						name="isShitStamped"
						label="Shit pack stamps only?"
						setValue={checked =>
							checked
								? rules.stamps.add('shit-stamp')
								: rules.stamps.delete('shit-stamp')
						}
					/>
				</Fieldset>
				<RuleCollectionBuilderRarityInput  />
				<RuleCollectionBuilderTagInput  />
				<Fieldset legend="Minted by">
					<label class="flex gap-2">
						<input
							type="radio"
							name="isMinter"
							value=""
							checked
							onInput={() => (rules.isMinter = undefined)}
						/>
						Anyone
					</label>
					<label class="flex gap-2">
						<input
							type="radio"
							name="isMinter"
							value="true"
							onInput={() => (rules.isMinter = true)}
						/>
						Me
					</label>
					<label class="flex gap-2">
						<input
							type="radio"
							name="isMinter"
							value="false"
							onInput={() => (rules.isMinter = false)}
						/>
						Anyone besides me
					</label>
				</Fieldset>
				<RuleCollectionBuilderCardNumberInput  />
				<RuleCollectionBuilderArtistInput  />
			</form>
		</RuleContext.Provider>
	);
};

const RuleCollectionBuilderDesignInput: Solid.Component = () => {
	const ctx = useCollectionContext();
	return (
		<Solid.Suspense fallback="Loading...">
			<Fieldset legend="Card Designs">
				<ul class="grid gap-8">
					<Solid.For each={Array.from(ctx.seasons)}>
						{([, { season, cards }]) => (
							<li class="overflow-x-hidden rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-900">
								<SeasonCheckboxAndDesigns cards={cards} season={season} />
							</li>
						)}
					</Solid.For>
				</ul>
			</Fieldset>
		</Solid.Suspense>
	);
};

const SeasonCheckboxAndDesigns: Solid.Component<{
	cards: Array<DB.CardDesign>;
	season: DB.Season;
}> = props => {
	const rules = useRules();
	return (
		<div>
			<p class="text-lg">{props.season.seasonName}</p>
			<label class="flex gap-2">
				<input
					type="checkbox"
					value={props.season.seasonId}
					onInput={e => {
						const cards = props.cards;
						if (e.currentTarget.checked) {
							Solid.batch(() => cards.map(c => rules.cardDesignIds.add(c.designId)));
						} else {
							Solid.batch(() =>
								cards.map(c => rules.cardDesignIds.delete(c.designId))
							);
						}
					}}
				/>
				Select All
			</label>
			<div class="scrollbar-narrow relative flex w-full gap-4 overflow-x-scroll p-3 py-4 data-[disabled=true]:overflow-x-hidden">
				<Solid.For each={props.cards}>
					{design => (
						<CardCheckbox
							name="designIds"
							value={design.designId}
							checked={rules.cardDesignIds.has(design.designId)}
							onInput={e => {
								if (e.currentTarget.checked) {
									rules.cardDesignIds.add(design.designId);
								} else {
									rules.cardDesignIds.delete(design.designId);
								}
							}}>
							<DesignCard design={design} />
						</CardCheckbox>
					)}
				</Solid.For>
			</div>
		</div>
	);
};

const RuleCollectionBuilderRarityInput: Solid.Component = () => {
	const rules = useRules();
	const [isEnabled, setIsEnabled] = Solid.createSignal(false);
	const rarities: Array<[id: string, name: string]> = [
		[FULL_ART_ID, 'Full Art'],
		['pink', 'Pink'],
		['rainbow', 'Rainbow'],
		['white', 'White'],
		['gold', 'Gold'],
		['silver', 'Silver'],
		['bronze', 'Bronze'],
	];

	return (
		<Fieldset legend="Rarities">
			<label class="flex gap-2">
				<input
					type="radio"
					name="rarities-enabled"
					value="false"
					checked
					onChange={e => {
						if (e.currentTarget.checked) {
							Solid.batch(() => rarities.map(([id]) => rules.rarityIds.delete(id)));
							setIsEnabled(false);
						}
					}}
				/>
				Any rarity
			</label>
			<label class="flex gap-2">
				<input
					type="radio"
					name="rarities-enabled"
					value="true"
					onChange={e => setIsEnabled(e.currentTarget.checked)}
				/>
				Specific rarity
			</label>
			<div class="ml-4 grid gap-2">
				<Solid.For each={rarities}>
					{([rarityId, rarityName]) => (
						<label
							class="flex gap-2 data-[disabled=true]:opacity-50"
							data-disabled={!isEnabled()}>
							<input
								type="checkbox"
								name='rarity-id'
								value={rarityId}
								checked={rules.rarityIds.has(rarityId)}
								disabled={!isEnabled()}
								onInput={e =>
									e.currentTarget.checked
										? rules.rarityIds.add(rarityId)
										: rules.rarityIds.delete(rarityId)
								}
							/>
							{rarityName}
						</label>
					)}
				</Solid.For>
			</div>
		</Fieldset>
	);
};

const RuleCollectionBuilderTagInput: Solid.Component = () => {
	const rules = useRules();
	const ctx = useCollectionContext();

	const tags = new ReactiveSet(
		Array.from(ctx.seasons.values()).flatMap(s => s.cards.flatMap(c => c.tags ?? []))
	);

	return (
		<Solid.Show when={tags.size}>
			<Fieldset legend="Tags">
				<Solid.For each={[...tags]}>
					{tag => (
						<label class="flex gap-2 data-[disabled=true]:opacity-50">
							<input
								type="checkbox"
								name="tags"
								value={tag}
								onInput={e =>
									e.currentTarget.checked
										? rules.tags.add(tag)
										: rules.tags.delete(tag)
								}
							/>
							{tag}
						</label>
					)}
				</Solid.For>
			</Fieldset>
		</Solid.Show>
	);
};

const RuleCollectionBuilderCardNumberInput: Solid.Component = () => {
	const [isNumberEnabled, setIsNumberEnabled] = Solid.createSignal(false);
	const [isDenominatorEnabled, setIsDenominatorEnabled] = Solid.createSignal(false);
	const rules = useRules();

	return (
		<Fieldset legend="Card Number">
			<ul>
				<li class="flex items-center gap-4">
					<span class="inline-block w-32">Numerator</span>
					<label class="flex gap-2">
						<input
							type="radio"
							name="useCardNumber"
							value="false"
							checked
							onChange={e => {
								setIsNumberEnabled(!e.currentTarget.checked);
								rules.cardNumbers.clear();
							}}
						/>
						Any
					</label>
					<label class="flex gap-2">
						<input
							type="radio"
							name="useCardNumber"
							value="true"
							onChange={e => setIsNumberEnabled(e.currentTarget.checked)}
						/>
						<span class="sr-only">Specific Number</span>
					</label>
					<div
						class="max-w-40 data-[disabled='true']:opacity-40"
						data-disabled={!isNumberEnabled()}>
						<NumberInput
							inputOnly
							min={0}
							step={1}
							value={isNumberEnabled() ? 0 : undefined}
							name="cardNumber"
							label="Value"
							disabled={!isNumberEnabled()}
							setValue={e => {
								Solid.batch(() => {
									rules.cardNumbers.clear();
									rules.cardNumbers.add(parseInt(e));
								});
							}}
						/>
					</div>
				</li>
				<li class="flex items-center gap-4">
					<span class="inline-block w-32">Denominator</span>
					<label class="flex gap-2">
						<input
							type="radio"
							name="useCardDenominator"
							value="false"
							checked
							onChange={e => {
								setIsDenominatorEnabled(!e.currentTarget.checked);
								rules.cardDenominators.clear();
							}}
						/>
						Any
					</label>
					<label class="flex gap-2">
						<input
							type="radio"
							name="useCardDenominator"
							value="true"
							onChange={e => setIsDenominatorEnabled(e.currentTarget.checked)}
						/>
						<span class="sr-only">Specific Number</span>
					</label>
					<div
						class="max-w-40 data-[disabled='true']:opacity-40"
						data-disabled={!isDenominatorEnabled()}>
						<NumberInput
							inputOnly
							min={0}
							step={1}
							value={isDenominatorEnabled() ? 0 : undefined}
							name="card-denominator"
							label="Value"
							disabled={!isDenominatorEnabled()}
							setValue={e => {
								Solid.batch(() => {
									rules.cardDenominators.clear();
									rules.cardDenominators.add(parseInt(e));
								});
							}}
						/>
					</div>
				</li>
			</ul>
		</Fieldset>
	);
};

const RuleCollectionBuilderArtistInput: Solid.Component = () => {
	const rules = useRules();
	const ctx = useCollectionContext();

	const artists = new ReactiveSet(
		Array.from(ctx.seasons.values()).flatMap(s => s.cards.flatMap(c => c.artist))
	);

	return (
		<Solid.Show when={artists.size}>
			<Fieldset legend="Artists">
				<Solid.For each={[...artists]}>
					{tag => (
						<label class="flex gap-2 data-[disabled=true]:opacity-50">
							<input
								type="checkbox"
								name="tags"
								value={tag}
								onInput={e =>
									e.currentTarget.checked
										? rules.artists.add(tag)
										: rules.artists.delete(tag)
								}
							/>
							{tag}
						</label>
					)}
				</Solid.For>
			</Fieldset>
		</Solid.Show>
	);
};

const CardCheckbox: Solid.ParentComponent<{
	name: string;
	value: string;
	checked?: boolean;
	disabled?: boolean;
	onInput?: (
		e: InputEvent & {
			currentTarget: HTMLInputElement;
			target: HTMLInputElement;
		}
	) => void;
}> = props => (
	<label class="focus-within:outline-brand-main relative grid w-fit cursor-pointer place-items-center opacity-40 focus-within:opacity-75 focus-within:outline has-[:checked]:opacity-100">
		<input
			onInput={e => props.onInput?.(e)}
			class="absolute left-4 top-4 z-50 opacity-40 checked:opacity-100"
			name={props.name}
			value={props.value}
			checked={props.checked}
			disabled={props.disabled}
			type="checkbox"
		/>
		{props.children}
	</label>
);

const DesignCard: Solid.Component<{
	design: DB.CardDesign;
}> = props => {
	const rarityId = () =>
		props.design.rarityDetails?.slice().sort((a, b) => b.count - a.count)[0].rarityId ??
		props.design.bestRarityFound?.rarityId ??
		'';

	return (
		<CardEls.Card
			lazy={false}
			scale={0.5}
			alt={props.design.cardName}
			viewTransitionName={`design-${props.design.designId}`}
			imgSrc={cardUtils.getCardImageUrl({
				designId: props.design.designId,
				rarityId: rarityId(),
			})}
			background={
				cardUtils.checkIsFullArt(rarityId())
					? FULL_ART_BACKGROUND_CSS
					: props.design.bestRarityFound?.rarityColor
			}>
			<Solid.Show when={cardUtils.checkIfCanShowCardText(rarityId())}>
				<CardEls.CardName>{props.design.cardName}</CardEls.CardName>
				<CardEls.CardDescription>{props.design.cardDescription}</CardEls.CardDescription>
			</Solid.Show>
		</CardEls.Card>
	);
};

const PreviewCard: Solid.Component<{
	card: DB.CardInstance;
}> = props => {
	return (
		<CardEls.Card
			lazy={false}
			scale={0.5}
			alt={props.card.cardName}
			imgSrc={cardUtils.getCardImageUrl(props.card)}
			viewTransitionName={`card-${props.card.instanceId}`}
			background={
				cardUtils.checkIsFullArt(props.card.rarityId)
					? FULL_ART_BACKGROUND_CSS
					: props.card.rarityColor
			}>
			<Solid.Show when={cardUtils.checkIfCanShowCardText(props.card.rarityId)}>
				<CardEls.CardName>{props.card.cardName}</CardEls.CardName>
				<CardEls.CardDescription>{props.card.cardDescription}</CardEls.CardDescription>
			</Solid.Show>
			<Solid.Show when={!cardUtils.checkIsLegacyCard(props.card.rarityId)}>
				<CardEls.CardNumber
					color={cardUtils.checkIsFullArt(props.card.rarityId) ? 'white' : 'black'}>
					{cardUtils.formatCardNumber(props.card)}
				</CardEls.CardNumber>
			</Solid.Show>
			<Solid.Show when={cardUtils.checkIsShitPack(props.card.stamps)}>
				<CardEls.ShitStamp src={cardUtils.getShitStampPath(props.card.rarityId)} />
			</Solid.Show>
		</CardEls.Card>
	);
};

const InstanceCard: Solid.Component<{
	card: DB.CardInstance;
}> = props => {
	return (
		<CardEls.Card
			lazy={false}
			alt={props.card.cardName}
			imgSrc={cardUtils.getCardImageUrl(props.card)}
			viewTransitionName={`card-${props.card.instanceId}`}
			background={
				cardUtils.checkIsFullArt(props.card.rarityId)
					? FULL_ART_BACKGROUND_CSS
					: props.card.rarityColor
			}>
			<Solid.Show when={cardUtils.checkIfCanShowCardText(props.card.rarityId)}>
				<CardEls.CardName>{props.card.cardName}</CardEls.CardName>
				<CardEls.CardDescription>{props.card.cardDescription}</CardEls.CardDescription>
			</Solid.Show>
			<Solid.Show when={!cardUtils.checkIsLegacyCard(props.card.rarityId)}>
				<CardEls.CardNumber
					color={cardUtils.checkIsFullArt(props.card.rarityId) ? 'white' : 'black'}>
					{cardUtils.formatCardNumber(props.card)}
				</CardEls.CardNumber>
			</Solid.Show>
			<Solid.Show when={cardUtils.checkIsShitPack(props.card.stamps)}>
				<CardEls.ShitStamp src={cardUtils.getShitStampPath(props.card.rarityId)} />
			</Solid.Show>
		</CardEls.Card>
	);
};

function checkAreRulesEmpty(rules: DB.CollectionRules) {
	return Object.values(rules).filter(v => v !== null).length === 0;
}

export function formatCollectionViewTransitionId(options: {
	cardId: string;
	collectionId: string;
}): string {
	return `card-${options.cardId}-collection-${options.collectionId}`;
}
