import type { CardDesign, CardInstance, Collection } from '@core/types';
import { trpc } from '@site/lib/client/trpc';
import {
	createResource,
	createSignal,
	For,
	Show,
	Suspense,
	type Component,
	type ParentComponent,
} from 'solid-js';
import { Checkbox, Fieldset } from '@site/components/Form';
import { CardEls, cardUtils, FULL_ART_BACKGROUND_CSS } from '@site/components/Card';

export const CardCollectionBuilder: Component<{
	cards: Array<CardInstance>;
}> = props => {
	const [cardIds, setCardIds] = createSignal<Array<string>>([]);
	const [cards] = createResource(cardIds, async cardIds =>
		trpc.collections.mockLoadCardsSet.query({ cards: cardIds })
	);

	return (
		<div>
			<ul>
				<For each={cards()}>{card => <li>{card.instanceId}</li>}</For>
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
					<For each={props.cards}>{card => <CardCheckBox card={card} />}</For>
				</fieldset>
			</form>
		</div>
	);
};

const CardCheckBox: Component<{ card: CardInstance }> = props => (
	<label class="flex gap-2">
		<input type="checkbox" name="cards" value={props.card.instanceId} />
		{props.card.instanceId}
	</label>
);

export const RuleCollectionBuilder: Component = () => {
	const [rules, setRules] = createSignal<NonNullable<Collection['rules']>>({});
	const [cards] = createResource(rules, async rules => {
		if (Object.values(rules).filter(v => v !== null).length === 0) {
			return [];
		}
		return trpc.collections.mockLoadCardsRule.query(rules);
	});

	return (
		<div>
			<ul class="h-80 overflow-y-scroll flex gap-4 flex-wrap">
				<Suspense>
					<For each={cards.latest} fallback={<p>Collection is empty.</p>}>
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

					let designIds = formData.getAll('designIds').map(String);
					let seasonIds = formData.getAll('seasonIds').map(String);
					setRules({
						cardDesignIds: designIds.length ? designIds : undefined,
						seasonIds: seasonIds.length ? seasonIds : undefined,
            stamps: undefined,
            rarityIds: undefined,
            mintedByIds: undefined,
            isMinter: undefined,
            cardNumerators: undefined,
            tags: undefined,
					});
				}}>
				<RuleCollectionBuilderDesignInput name="designIds" />
				<RuleCollectionBuilderSeasonInput name="seasonIds" />
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

