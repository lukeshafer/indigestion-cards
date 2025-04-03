import type * as DB from '@core/types';
import { trpc } from '@site/client/api';
import * as Solid from 'solid-js';
import { Checkbox, Fieldset, SubmitButton, TextInput } from '@site/components/Form';
import { CardEls, cardUtils, FULL_ART_BACKGROUND_CSS } from '@site/components/Card';
import { FULL_ART_ID, routes } from '@site/constants';
import { createStore, produce, reconcile } from 'solid-js/store';
import * as CardList from './CardList';

export const CollectionBuilder: Solid.Component<{ cards: Array<DB.CardInstance> }> = props => {
	const [state, setState] = createStore({
		type: 'set' as 'set' | 'rule',
		rules: {} as DB.CollectionRules,
		cards: [] as DB.CollectionCards,
		previewCards: [] as Array<DB.CardInstance>,
		collectionName: '',
	});

	Solid.createEffect(
		Solid.on(
			() => state.type,
			type => {
				if (type === 'set') setState('rules', {});
				else if (type === 'rule') setState('cards', []);
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
				console.log('fetching preview cards', Date.now());
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
							trpc.collections.mockLoadCardsRule
								.query(rules)
								.then(result => setState('previewCards', reconcile(result)));
						}
						break;
				}
			}
		)
	);

	return (
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
							onChange={() => setState('type', 'set')}
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
							onChange={() => setState('type', 'rule')}
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
					disabled={state.previewCards.length === 0 || state.collectionName.length === 0}>
					<div class="w-fit">Save Collection</div>
				</SubmitButton>
				<CollectionCardsPreviewList cards={state.previewCards} type={state.type} />
			</form>
		</div>
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

const RuleCollectionBuilder: Solid.Component<{
	setRules: (rules: DB.CollectionRules) => void;
}> = props => {
	return (
		<form
			class="grid h-fit gap-2"
			onSubmit={e => e.preventDefault()}
			onChange={e => {
				let form = e.currentTarget;
				let formData = new FormData(form);

				let designIds = formData.getAll('designIds').map(String);
				let seasonIds = formData.getAll('seasonIds').map(String);
				let isShitStamped = formData.get('isShitStamped') === 'on';
				let rarityIds = formData.getAll('rarityIds').map(String);
				let isMinter = formData.get('isMinter');
				props.setRules({
					cardDesignIds: designIds.length ? designIds : undefined,
					seasonIds: seasonIds.length ? seasonIds : undefined,
					stamps: isShitStamped ? ['shit-pack'] : undefined,
					rarityIds: rarityIds.length ? rarityIds : undefined,
					mintedByIds: undefined,
					isMinter: isMinter === 'true' ? true : isMinter === 'false' ? false : undefined,
					cardNumbers: undefined,
				});
			}}>
			<RuleCollectionBuilderDesignInput name="designIds" />
			<Fieldset legend="Stamped">
				<Checkbox name="isShitStamped" label="Shit pack stamps only?" />
			</Fieldset>
			<RuleCollectionBuilderRarityInput name="rarityIds" />
			<Fieldset legend="Minted by">
				<label class="flex gap-2">
					<input type="radio" name="isMinter" value="" checked />
					Anyone
				</label>
				<label class="flex gap-2">
					<input type="radio" name="isMinter" value="true" />
					Me
				</label>
				<label class="flex gap-2">
					<input type="radio" name="isMinter" value="false" />
					Anyone besides me
				</label>
			</Fieldset>
		</form>
	);
};

const RuleCollectionBuilderDesignInput: Solid.Component<{ name: string }> = () => {
	const [seasons] = Solid.createResource(async () =>
		trpc.seasons.getAllWithDesigns
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
	);

	return (
		<Solid.Suspense fallback="Loading...">
			<Fieldset legend="Card Designs">
				<ul class="grid gap-8">
					<Solid.For each={seasons()}>
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
	const [seasonChecked, setSeasonChecked] = Solid.createSignal(false);
	return (
		<div>
			<p class="text-lg">{props.season.seasonName}</p>
			<label class="flex gap-2">
				<input
					type="checkbox"
					name="seasonIds"
					value={props.season.seasonId}
					onInput={e => setSeasonChecked(e.currentTarget.checked)}
				/>
				All {props.season.seasonName} cards
			</label>
			<div
				class="scrollbar-narrow relative flex w-full gap-4 overflow-x-scroll p-3 py-4 data-[disabled=true]:overflow-x-hidden"
				data-disabled={seasonChecked()}>
				<Solid.For each={props.cards}>
					{design => (
						<CardCheckbox
							name="designIds"
							value={design.designId}
							checked={seasonChecked() ? false : undefined}
							disabled={seasonChecked() ? true : false}>
							<DesignCard design={design} />
						</CardCheckbox>
					)}
				</Solid.For>
				<Solid.Show when={seasonChecked()}>
					<div class="absolute inset-0 grid place-items-center bg-gray-100/75 dark:bg-black/75">
						<p class="text-3xl">All {props.season.seasonName} cards selected.</p>
					</div>
				</Solid.Show>
			</div>
		</div>
	);
};

const RuleCollectionBuilderRarityInput: Solid.Component<{ name: string }> = props => {
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
					checked={!isEnabled()}
					onChange={e => setIsEnabled(!e.currentTarget.checked)}
				/>
				Any rarity
			</label>
			<label class="flex gap-2">
				<input
					type="radio"
					name="rarities-enabled"
					value="true"
					checked={isEnabled()}
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
								name={props.name}
								value={rarityId}
								disabled={!isEnabled()}
							/>
							{rarityName}
						</label>
					)}
				</Solid.For>
			</div>
		</Fieldset>
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
	const rarityId = () => props.design.bestRarityFound?.rarityId ?? '';

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
				<CardEls.CardDescription>{props.card.cardName}</CardEls.CardDescription>
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
				<CardEls.CardDescription>{props.card.cardName}</CardEls.CardDescription>
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
