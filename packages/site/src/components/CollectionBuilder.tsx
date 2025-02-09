import type { CardDesign, CardInstance, Collection } from '@core/types';
import { trpc } from '@site/lib/client/trpc';
import {
	createResource,
	createSignal,
	For,
	Match,
	onMount,
	Show,
	Suspense,
	Switch,
	type Component,
	type ParentComponent,
} from 'solid-js';
import { Checkbox, Fieldset } from '@site/components/Form';
import { CardEls, cardUtils, FULL_ART_BACKGROUND_CSS } from '@site/components/Card';
import { FULL_ART_ID } from '@site/constants';

export const CollectionBuilder: Component = () => {
	const [collectionType, setCollectionType] = createSignal<'set' | 'rule'>('set');
	return (
		<>
			<label class="flex gap-2">
				<input
					type="radio"
					name="collectionType"
					value="set"
          checked
					onChange={() => setCollectionType('set')}
				/>
				Standard
			</label>
			<label class="flex gap-2">
				<input
					type="radio"
					name="collectionType"
					value="rule"
					onChange={() => setCollectionType('rule')}
				/>
				Advanced
			</label>
			<Switch>
				<Match when={collectionType() === 'set'}>
					<SetCollectionBuilder />
				</Match>
				<Match when={collectionType() === 'rule'}>
					<RuleCollectionBuilder />
				</Match>
			</Switch>
		</>
	);
};

export const SetCollectionBuilder: Component = () => {
	const [cardIds, setCardIds] = createSignal<Array<string>>([]);
	const [previewCards] = createResource(cardIds, async cardIds => {
		if (cardIds.length === 0) return [];
		return trpc.collections.mockLoadCardsSet.query({ cards: cardIds });
	});

	const [userCards, setUserCards] = createSignal<Array<CardInstance>>([]);
	onMount(() => {
		trpc.userCards.authUserCards.query().then(setUserCards);
	});

	return (
		<div>
			<ul class="flex h-80 flex-wrap gap-4 overflow-y-scroll">
				<Suspense>
					<For each={previewCards.latest} fallback={<p>Collection is empty.</p>}>
						{card => (
							<li>
								<InstanceCard card={card} />
							</li>
						)}
					</For>
				</Suspense>
			</ul>
			<form
				onChange={e => {
					let form = e.currentTarget;

					let formData = new FormData(form);
					let cardIds = formData.getAll('cards').filter(c => typeof c === 'string');
					setCardIds(cardIds);
				}}>
				<fieldset>
					<legend>Cards</legend>
					<div class="flex flex-wrap gap-4">
						<For each={userCards()}>
							{card => (
								<CardCheckbox name="cards" value={card.instanceId}>
									<InstanceCard card={card} />
									<p class="text-center">{card.cardName}</p>
								</CardCheckbox>
							)}
						</For>
					</div>
				</fieldset>
			</form>
		</div>
	);
};

export const RuleCollectionBuilder: Component = () => {
	const [rules, setRules] = createSignal<NonNullable<Collection['rules']>>({});
	const [previewCards] = createResource(rules, async rules => {
		if (Object.values(rules).filter(v => v !== null).length === 0) {
			return [];
		}
		return trpc.collections.mockLoadCardsRule.query(rules);
	});

	return (
		<div>
			<ul class="flex h-80 flex-wrap gap-4 overflow-y-scroll">
				<Suspense>
					<For each={previewCards.latest} fallback={<p>Collection is empty.</p>}>
						{card => (
							<li>
								<InstanceCard card={card} />
							</li>
						)}
					</For>
				</Suspense>
			</ul>
			<form
				class="grid gap-2"
				onChange={e => {
					let form = e.currentTarget;
					let formData = new FormData(form);

					let designIds = formData.getAll('designIds').map(String);
					let seasonIds = formData.getAll('seasonIds').map(String);
					let isShitStamped = formData.get('isShitStamped') === 'checked';
					let rarityIds = formData.getAll('rarityIds').map(String);
					let isMinter = formData.get('isMinter');
					setRules({
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
				<RuleCollectionBuilderSeasonInput name="seasonIds" />
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

const RuleCollectionBuilderDesignInput: Component<{ name: string }> = props => {
	const [isVisible, setIsVisible] = createSignal(false);
	const [designs] = createResource(async () => trpc.designs.getAll.query());

	return (
		<div>
			<Checkbox name="includeDesignIds" label="By card" setValue={setIsVisible} />
			<Show when={isVisible()}>
				<Suspense fallback="Loading...">
					<Fieldset legend="Cards">
						<div class="flex flex-wrap gap-4">
							<For each={designs()}>
								{design => (
									<CardCheckbox name={props.name} value={design.designId}>
										<DesignCard design={design} />
										<p class="text-center">{design.cardName}</p>
									</CardCheckbox>
								)}
							</For>
						</div>
					</Fieldset>
				</Suspense>
			</Show>
		</div>
	);
};

const RuleCollectionBuilderSeasonInput: Component<{ name: string }> = props => {
	const [isVisible, setIsVisible] = createSignal(false);
	const [seasons] = createResource(async () => trpc.seasons.getAll.query());

	return (
		<div>
			<Checkbox
				name="includeSeasonIds"
				label="By season"
				setValue={setIsVisible}
				value={isVisible()}
			/>
			<Show when={isVisible()}>
				<Suspense fallback="Loading...">
					<Fieldset legend="Seasons">
						<div class="grid gap-2">
							<For each={seasons()}>
								{season => (
									<label class="flex gap-2">
										<input
											type="checkbox"
											name={props.name}
											value={season.seasonId}
										/>
										{season.seasonName}
									</label>
								)}
							</For>
						</div>
					</Fieldset>
				</Suspense>
			</Show>
		</div>
	);
};

const RuleCollectionBuilderRarityInput: Component<{ name: string }> = props => {
	const [isVisible, setIsVisible] = createSignal(false);
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
		<div>
			<Checkbox
				name="includeRarityIds"
				label="By rarity"
				setValue={setIsVisible}
				value={isVisible()}
			/>
			<Show when={isVisible()}>
				<Fieldset legend="Rarities">
					<div class="grid gap-2">
						<For each={rarities}>
							{([rarityId, rarityName]) => (
								<label class="flex gap-2">
									<input type="checkbox" name={props.name} value={rarityId} />
									{rarityName}
								</label>
							)}
						</For>
					</div>
				</Fieldset>
			</Show>
		</div>
	);
};

const CardCheckbox: ParentComponent<{
	name: string;
	value: string;
}> = props => {
	return (
		<label class="relative grid w-40 cursor-pointer place-items-center opacity-40 has-[:checked]:opacity-100">
			<input
				class="absolute opacity-0 checked:left-4 checked:top-4 checked:z-50 checked:opacity-100"
				name={props.name}
				value={props.value}
				type="checkbox"
			/>
			{props.children}
		</label>
	);
};

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
