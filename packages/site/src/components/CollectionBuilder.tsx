import type {
	CardDesign,
	CardInstance,
	CollectionRules,
	CollectionCards,
	Season,
} from '@core/types';
import { trpc } from '@site/lib/client/trpc';
import {
	createEffect,
	createMemo,
	createResource,
	createSignal,
	For,
	Match,
	on,
	Show,
	Suspense,
	Switch,
	type Component,
	type ParentComponent,
} from 'solid-js';
import { Checkbox, Fieldset } from '@site/components/Form';
import { CardEls, cardUtils, FULL_ART_BACKGROUND_CSS } from '@site/components/Card';
import { FULL_ART_ID } from '@site/constants';
import { createStore, produce, reconcile } from 'solid-js/store';
import CardList from './CardList';
import { getCardSearcher } from '@site/lib/client/utils';

export const CollectionBuilder: Component<{ cards: Array<CardInstance> }> = props => {
	const [state, setState] = createStore({
		type: 'set' as 'set' | 'rule',
		rules: {} as CollectionRules,
		cards: [] as CollectionCards,
		previewCards: [] as Array<CardInstance>,
	});

	createEffect(
		on(
			() => state.type,
			type => {
				if (type === 'set') setState('rules', {});
				else if (type === 'rule') setState('cards', []);
			}
		)
	);

	createEffect(
		on(
			() => ({
				type: state.type,
				rules: { ...state.rules },
				cards: [...state.cards],
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
		<>
			<label class="flex gap-2">
				<input
					type="radio"
					name="collectionType"
					value="set"
					checked={state.type === 'set'}
					onChange={() => setState('type', 'set')}
				/>
				Set
			</label>
			<label class="flex gap-2">
				<input
					type="radio"
					name="collectionType"
					value="rule"
					checked={state.type === 'rule'}
					onChange={() => setState('type', 'rule')}
				/>
				Rules
			</label>
			<div
				class="lg:grid"
				style={{
					'grid-template-columns': 'auto auto',
				}}>
				<Switch>
					<Match when={state.type === 'set'}>
						<SetCollectionBuilder
							userCards={props.cards}
							selectedCards={state.cards}
							addCardId={instanceId => {
								if (state.cards.includes(instanceId)) return;
								setState('cards', state.cards.length, instanceId);
							}}
							removeCardId={instanceId => {
								let indexes = state.cards.reduce((indexes, value, index) => {
									if (value === instanceId) {
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
					</Match>
					<Match when={state.type === 'rule'}>
						<RuleCollectionBuilder setRules={rules => setState('rules', rules)} />
					</Match>
				</Switch>
				<CollectionCardsPreviewList cards={state.previewCards} type={state.type} />
			</div>
		</>
	);
};

const CollectionCardsPreviewList: Component<{
	cards: Array<CardInstance>;
	type: 'set' | 'rule';
}> = props => {
	return (
		<section aria-labelledby="collection-preview-title">
			<h2 id="collection-preview-title" class="text-center text-xl">
				Collection Preview
			</h2>
			<ul class="m-4 flex h-fit w-full flex-wrap gap-4">
				<Suspense fallback={<p>Loading</p>}>
					<For
						each={props.cards}
						fallback={
							<p class="my-8 w-full text-center opacity-50">
								{props.type === 'set'
									? 'Collection is empty.'
									: 'Please select a filter to preview your collection.'}
							</p>
						}>
						{card => (
							<li
								draggable={props.type === 'set'}
								classList={{ 'cursor-pointer': props.type === 'set' }}>
								<InstanceCard card={card} />
							</li>
						)}
					</For>
				</Suspense>
			</ul>
		</section>
	);
};

const SetCollectionBuilder: Component<{
	userCards: Array<CardInstance>;
	selectedCards: Array<string>;
	addCardId: (card: string) => void;
	removeCardId: (card: string) => void;
}> = props => {
	const [searchText, setSearchText] = createSignal('');
	const searcher = createMemo(() => getCardSearcher(props.userCards));
	const cards = () => (searchText() ? searcher()(searchText()) : props.userCards);

	return (
		<fieldset class="max-w-3xl grid">
			<legend class="my-4 text-center text-xl">Cards</legend>
			<div class="flex flex-wrap gap-4">
				<CardList.Search setSearchText={setSearchText} />
				<CardList.List cards={cards()} scale={0.5}>
					{card => (
						<CardCheckbox
							checked={props.selectedCards.includes(card.instanceId)}
							name="cards"
							value={card.instanceId}
							onInput={e => {
								if (e.currentTarget.checked) props.addCardId(card.instanceId);
								else props.removeCardId(card.instanceId);
							}}>
							<InstanceCard card={card} />
							{
								//<p class="text-center">{card.cardName}</p>
							}
						</CardCheckbox>
					)}
				</CardList.List>
			</div>
		</fieldset>
	);
};

const RuleCollectionBuilder: Component<{
	setRules: (rules: CollectionRules) => void;
}> = props => {
	return (
		<div>
			<form
				class="grid gap-2"
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
						isMinter:
							isMinter === 'true' ? true : isMinter === 'false' ? false : undefined,
						cardNumbers: undefined,
					});
				}}>
				<RuleCollectionBuilderDesignInput name="designIds" />
				<Checkbox name="isShitStamped" label="Shit pack stamps only?" />
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
		</div>
	);
};

const RuleCollectionBuilderDesignInput: Component<{ name: string }> = () => {
	const [seasons] = createResource(async () =>
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
		<div>
			<Suspense fallback="Loading...">
				<Fieldset legend="Cards">
					<div class="grid gap-4">
						<For each={seasons()}>
							{([, { season, cards }]) => (
								<SeasonCheckboxAndDesigns cards={cards} season={season} />
							)}
						</For>
					</div>
				</Fieldset>
			</Suspense>
		</div>
	);
};

const SeasonCheckboxAndDesigns: Component<{ cards: Array<CardDesign>; season: Season }> = props => {
	const [seasonChecked, setSeasonChecked] = createSignal(false);
	return (
		<div class="max-w-3xl">
			<label class="flex gap-2">
				<input
					type="checkbox"
					name="seasonIds"
					value={props.season.seasonId}
					onInput={e => setSeasonChecked(e.currentTarget.checked)}
				/>
				{props.season.seasonName}
			</label>
			<div
				class="scrollbar-narrow relative flex gap-4 overflow-x-scroll bg-gray-100 p-3 py-4 data-[disabled=true]:overflow-x-hidden dark:bg-gray-900"
				data-disabled={seasonChecked()}>
				<For each={props.cards}>
					{design => (
						<CardCheckbox
							name="designIds"
							value={design.designId}
							checked={seasonChecked() ? false : undefined}
							disabled={seasonChecked() ? true : false}>
							<DesignCard design={design} />
						</CardCheckbox>
					)}
				</For>
				<Show when={seasonChecked()}>
					<div class="absolute inset-0 grid place-items-center bg-gray-100/75 dark:bg-black/75">
						<p class="text-3xl">All {props.season.seasonName} cards selected.</p>
					</div>
				</Show>
			</div>
		</div>
	);
};

const RuleCollectionBuilderRarityInput: Component<{ name: string }> = props => {
	const [isEnabled, setIsEnabled] = createSignal(false);
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
				<For each={rarities}>
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
				</For>
			</div>
		</Fieldset>
	);
};

const CardCheckbox: ParentComponent<{
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
	<label class="focus-within:outline-brand-main relative grid w-40 cursor-pointer place-items-center opacity-40 focus-within:opacity-75 focus-within:outline has-[:checked]:opacity-100">
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

const DesignCard: Component<{
	design: CardDesign;
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
			<Show when={cardUtils.checkIfCanShowCardText(rarityId())}>
				<CardEls.CardName>{props.design.cardName}</CardEls.CardName>
				<CardEls.CardDescription>{props.design.cardDescription}</CardEls.CardDescription>
			</Show>
		</CardEls.Card>
	);
};

const InstanceCard: Component<{
	card: CardInstance;
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
			<Show when={cardUtils.checkIfCanShowCardText(props.card.rarityId)}>
				<CardEls.CardName>{props.card.cardName}</CardEls.CardName>
				<CardEls.CardDescription>{props.card.cardName}</CardEls.CardDescription>
			</Show>
			<Show when={!cardUtils.checkIsLegacyCard(props.card.rarityId)}>
				<CardEls.CardNumber
					color={cardUtils.checkIsFullArt(props.card.rarityId) ? 'white' : 'black'}>
					{cardUtils.formatCardNumber(props.card)}
				</CardEls.CardNumber>
			</Show>
			<Show when={cardUtils.checkIsShitPack(props.card.stamps)}>
				<CardEls.ShitStamp src={cardUtils.getShitStampPath(props.card.rarityId)} />
			</Show>
		</CardEls.Card>
	);
};

function checkAreRulesEmpty(rules: CollectionRules) {
	return Object.values(rules).filter(v => v !== null).length === 0;
}
