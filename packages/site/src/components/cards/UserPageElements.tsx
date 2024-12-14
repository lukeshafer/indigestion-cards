import { default as CardList, filterCards, parseUniqueSeasons, type Filters } from './CardList';
import { type SortInfo, getSortInfo } from '@site/lib/client/utils';
import {
	Show,
	For,
	Suspense,
	createResource,
	createSignal,
	type Component,
	type Setter,
} from 'solid-js';
import { trpc } from '@site/lib/client/trpc';
import PlaceholderCardList from './PlaceholderCardList';
import { routes } from '@site/constants';
import {
	Card,
	CardDescription,
	CardName,
	CardNumber,
	checkIfCanShowCardText,
	checkIsFullArt,
	checkIsLegacyCard,
	checkIsShitPack,
	formatCardNumber,
	FULL_ART_BACKGROUND_CSS,
	FullAnimatedCardEffect,
	getCardImageUrl,
	getShitStampPath,
	GlowOnHover,
	ShineMouseEffect,
	ShitStamp,
	TiltEffectWrapper,
} from './Card';
import type { CardInstance, User } from '@core/types';
import type { PackCardsHidden } from '@core/types';
import { Pack } from '../pack/Pack';
import { transformPackTypeName } from '@site/lib/client/utils';
import { actions } from 'astro:actions';

export const UserCardList: Component<{
	initialCards: CardInstance[];
	username: string;
	initialFilters: Filters;
	initialCursor?: string;
	pinnedCardId?: string;
}> = props => {
	const [nextCursor, setNextCursor] = createSignal(props.initialCursor ?? null);
	const [sortInfo, setSortInfo] = createSignal<SortInfo>({
		by: 'rarity',
		isReversed: false,
	});
	const [filters, setFilters] = createSignal(props.initialFilters);
	const [searchText, setSearchText] = createSignal('');

	const [cardsResource, { mutate: mutateCards }] = createResource(
		() => ({
			sortInfo: sortInfo(),
			username: props.username,
			setNextCursor,
			pinnedCardId: props.pinnedCardId,
			searchText: searchText(),
		}),
		queryCards,
		{ initialValue: props.initialCards, ssrLoadFrom: 'initial' }
	);

	const filteredCards = () => filterCards(cardsResource() ?? [], filters());
	return (
		<div>
			<CardList.Menu>
				<CardList.Filter
					params={{
						seasons: parseUniqueSeasons(cardsResource.latest),
						minterId: true,
					}}
					setFilters={setFilters}
					ssrFilters={/*@once*/ props.initialFilters}
				/>
				<div class="ml-auto flex gap-4">
					<CardList.Search setSearchText={setSearchText} />
					<CardList.SortDropdown
						sortTypes={[
							'rarest',
							'common',
							'card-name-asc',
							'card-name-desc',
							'open-date-asc',
							'open-date-desc',
						]}
						setSort={sortType => {
							setSortInfo(getSortInfo(sortType));
						}}
					/>
				</div>
			</CardList.Menu>
			<Suspense fallback={<PlaceholderCardList />}>
				<CardList.List cards={filteredCards() ?? []} scale={0.8}>
					{(card, index) => <UserCardListItem card={card} lazy={index() > 10} />}
				</CardList.List>
				<Show when={nextCursor() && !searchText()}>
					<CardList.LoadButton
						load={() =>
							queryCards({
								username: props.username,
								sortInfo: sortInfo(),
								cursor: nextCursor() || undefined,
								setNextCursor,
								searchText: '',
							}).then(result => mutateCards(cards => [...(cards ?? []), ...result]))
						}>
						Load more cards
					</CardList.LoadButton>
				</Show>
			</Suspense>
		</div>
	);
};

const UserCardListItem: Component<{
	card: CardInstance;
	lazy: boolean;
}> = props => (
	<a
		href={`${routes.USERS}/${props.card.username}/${props.card.instanceId ?? ''}`}
		class="outline-brand-main group inline-block transition-transform hover:-translate-y-2">
		<FullAnimatedCardEffect
			glowColor={checkIsFullArt(props.card.rarityId) ? undefined : props.card.rarityColor}>
			<Card
				lazy={props.lazy}
				alt={props.card.cardName}
				imgSrc={getCardImageUrl(props.card)}
				viewTransitionName={`card-${props.card.instanceId}`}
				background={
					checkIsFullArt(props.card.rarityId)
						? FULL_ART_BACKGROUND_CSS
						: props.card.rarityColor
				}>
				<Show when={checkIfCanShowCardText(props.card.rarityId)}>
					<CardName>{props.card.cardName}</CardName>
					<CardDescription>{props.card.cardName}</CardDescription>
				</Show>
				<Show when={!checkIsLegacyCard(props.card.rarityId)}>
					<CardNumber color={checkIsFullArt(props.card.rarityId) ? 'white' : 'black'}>
						{formatCardNumber(props.card)}
					</CardNumber>
				</Show>
				<Show when={checkIsShitPack(props.card.stamps)}>
					<ShitStamp src={getShitStampPath(props.card.rarityId)} />
				</Show>
			</Card>
		</FullAnimatedCardEffect>
	</a>
);

async function queryCards(opts: {
	sortInfo: SortInfo;
	username: string;
	cursor?: string;
	pinnedCardId?: string;
	setNextCursor: Setter<string | null>;
	searchText: string;
}): Promise<Array<CardInstance>> {
	if (opts.searchText.length > 0) {
		const result = await trpc.userCards.search.query({
			searchText: opts.searchText,
			username: opts.username,
			sortType: opts.sortInfo.by,
			isReversed: opts.sortInfo.isReversed,
			ignoredIds: opts.pinnedCardId ? [opts.pinnedCardId] : undefined,
		});

		return result;
	}

	const query =
		opts.sortInfo.by === 'cardName'
			? trpc.userCards.sortedByName.query
			: opts.sortInfo.by === 'rarity'
				? trpc.userCards.sortedByRarity.query
				: trpc.userCards.sortedByOpenDate.query;

	const result = await query({
		username: opts.username,
		isReversed: opts.sortInfo.isReversed,
		cursor: opts.cursor,
		ignoredIds: opts.pinnedCardId ? [opts.pinnedCardId] : undefined,
	});

	opts.setNextCursor(result.cursor);
	return result.data;
}

export const UserPinnedCard: Component<{
	card: NonNullable<User['pinnedCard']>;
	username: string;
}> = props => {
	return (
		<div class="ml-auto">
			<p class="text-center font-semibold uppercase text-gray-400">Pinned</p>
			<a
				href={`${routes.USERS}/${props.username}/${props.card.instanceId}`}
				class="outline-brand-main group inline-block">
				<TiltEffectWrapper>
					<GlowOnHover focusOnly color={props.card.rarityColor} />
					<Card
						lazy={false}
						alt={props.card.cardName}
						imgSrc={getCardImageUrl(props.card)}
						viewTransitionName={`card-${props.card.instanceId}`}
						background={
							checkIsFullArt(props.card.rarityId)
								? FULL_ART_BACKGROUND_CSS
								: props.card.rarityColor
						}>
						<Show when={checkIfCanShowCardText(props.card.rarityId)}>
							<CardName>{props.card.cardName}</CardName>
							<CardDescription>{props.card.cardName}</CardDescription>
						</Show>
						<Show when={!checkIsLegacyCard(props.card.rarityId)}>
							<CardNumber
								color={checkIsFullArt(props.card.rarityId) ? 'white' : 'black'}>
								{formatCardNumber(props.card)}
							</CardNumber>
						</Show>
						<Show when={checkIsShitPack(props.card.stamps)}>
							<ShitStamp src={getShitStampPath(props.card.rarityId)} />
						</Show>
					</Card>
					<ShineMouseEffect />
				</TiltEffectWrapper>
			</a>
		</div>
	);
};

export const UserPackList: Component<{
	packs: Array<PackCardsHidden>;
	isLoggedInUser: boolean;
}> = props => {
	return (
		<ul
			class="grid w-full justify-center justify-items-center gap-x-2 gap-y-14 px-3 [--card-scale:0.75] sm:[--card-scale:1] md:gap-x-6"
			style={{
				'grid-template-columns':
					'repeat(auto-fill, minmax(calc(var(--card-scale) * 18rem), 1fr))',
			}}>
			<For each={props.packs}>
				{pack => <PackListItem pack={pack} canChangeLock={props.isLoggedInUser} />}
			</For>
		</ul>
	);
};

const PackListItem: Component<{ pack: PackCardsHidden; canChangeLock: boolean }> = props => {
	const [isLocked, setIsLocked] = createSignal(props.pack.isLocked || false);

	return (
		<li class="relative w-fit">
			<Pack name={transformPackTypeName(props.pack.packTypeName)} scale={0.8} />

			<Show when={isLocked()}>
				<div class="absolute inset-0 bg-white/50 dark:bg-black/50">
					<p class="my-14">
						<span class="block text-xl">Locked.</span>Cannot be opened.
					</p>
				</div>
			</Show>
			<Show when={props.canChangeLock}>
				<div class="absolute left-2 top-7">
					<LockButton
						isLocked={isLocked()}
						onClick={() => {
							let newValue = !isLocked();
							actions.packs
								.setIsLocked({
									packId: props.pack.packId,
									isLocked: newValue,
								})
								.then(val => {
									if (val.error) {
										setIsLocked(!newValue);
									}
								});
							setIsLocked(newValue);
						}}
					/>
				</div>
			</Show>
		</li>
	);
};

const LockButton: Component<{ isLocked: boolean; onClick: () => void }> = props => {
	const [mouseDown, setMouseDown] = createSignal(false);
	const [isHovering, setIsHovering] = createSignal(false);

	return (
		<div class="flex gap-3">
			<button
				class="grouplockbutton transition-transform ease-in-out"
				onMouseOver={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
				onClick={() => {
					props.onClick();
				}}
				onMouseDown={() => setMouseDown(true)}
				onMouseUp={() => setMouseDown(false)}
				style={{
					transform: mouseDown() ? 'rotate(10deg)' : 'rotate(0deg)',
				}}>
				<Lock isLocked={props.isLocked} />
			</button>
			<div
				data-hovering={isHovering()}
				class="opacity-0 transition-opacity data-[hovering=true]:opacity-100">
				{props.isLocked ? 'Click to unlock' : 'Click to lock'}
			</div>
		</div>
	);
};

const Lock: Component<{ isLocked: boolean }> = props => (
	<div
		class="group relative block h-6 w-7 cursor-pointer rounded border-2 border-[--lock-color] transition-all duration-100 ease-in-out [--lock-color:black] data-[unlocked=true]:rotate-12 data-[unlocked=true]:hover:rotate-3 dark:[--lock-color:white]"
		data-unlocked={!props.isLocked}>
		<div class="absolute bottom-full left-1/2 h-4 w-5 -translate-x-1/2 rounded-tl-full rounded-tr-full border-2 border-b-0 border-[--lock-color] transition-all duration-100 ease-in-out group-data-[unlocked=true]:bottom-[130%] group-data-[unlocked=true]:left-1/4 group-data-[unlocked=true]:-rotate-[30deg] group-data-[unlocked=true]:group-hover:bottom-[124%] group-data-[unlocked=true]:group-hover:left-1/3 group-data-[unlocked=false]:group-hover:h-5 group-data-[unlocked=true]:group-hover:-rotate-[20deg]" />
		<div class="absolute left-1/2 top-1/2 h-2 w-1 -translate-x-1/2 -translate-y-1/2 bg-[--lock-color] transition-all duration-100 ease-in-out"></div>
	</div>
);
