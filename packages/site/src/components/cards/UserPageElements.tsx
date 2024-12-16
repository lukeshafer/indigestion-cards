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
import { SubmitButton } from '../form/Form';
import EditIcon from '../icons/EditIcon';

export const UserIdentitySection: Component<{
	username: string;
	profileImageUrl: string;
	isLoggedInUser: boolean;
	lookingFor?: string;
	pinnedCard?: User['pinnedCard'];
}> = props => {
	const IMG_SIZE = 100;
	return (
		<div class="w-fit">
			<section
				style={{
					'grid-template-rows': `repeat(1,${IMG_SIZE / 2}px)`,
				}}
				class="col-start-1 grid w-fit content-center gap-x-4">
				<img
					alt={`${props.username}'s profile image`}
					src={props.profileImageUrl}
					width={IMG_SIZE}
					height={IMG_SIZE}
					class="row-span-2 rounded-full"
				/>
				<h1 class="font-display col-start-2 self-end text-2xl italic">{props.username}</h1>

				<Show when={props.lookingFor}>
					{lookingFor => (
						<UserLookingFor
							lookingFor={lookingFor()}
							isLoggedInUser={props.isLoggedInUser}
						/>
					)}
				</Show>
			</section>

			<Show when={props.pinnedCard}>
				{pinnedCard => <UserPinnedCard card={pinnedCard()} username={props.username} />}
			</Show>
		</div>
	);
};

const UserLookingFor: Component<{
	lookingFor: string;
	isLoggedInUser: boolean;
}> = props => {
	const [isOpen, setIsOpen] = createSignal(false);
	return (
		<p
			data-open={isOpen()}
			class="relative col-start-2 grid max-h-32 max-w-80 gap-0 self-start overflow-hidden break-words pb-8 transition-all data-[open=true]:max-h-max">
			<span class="text-sm font-normal italic opacity-80 flex gap-2">
				I'm looking for
				<Show when={props.isLoggedInUser}>
					<button title="Edit looking for">
						<EditIcon size={15} />
					</button>
				</Show>
			</span>
			<span class="block max-w-80 break-words text-lg font-normal leading-5">
				{props.lookingFor}
			</span>
			<Show when={props.lookingFor.length > 40}>
				<button
					class="absolute bottom-0 h-8 w-full bg-gray-900/70 bg-gradient-to-t from-gray-900 to-gray-900/0"
					onClick={() => setIsOpen(v => !v)}>
					Show {isOpen() ? 'less' : 'more'}
				</button>
			</Show>
		</p>
	);
};

export const UserPinnedCard: Component<{
	card: NonNullable<User['pinnedCard']>;
	username: string;
}> = props => {
	return (
		<div class="relative w-fit origin-top-left rotate-3 p-12">
			<a
				href={`${routes.USERS}/${props.username}/${props.card.instanceId}`}
				class="outline-brand-main group inline-block">
				<TiltEffectWrapper transformOrigin="7rem 1rem" angleMultiplier={0.2}>
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
			<div class="absolute left-40 top-4">
				<Pin />
			</div>
		</div>
	);
};

const Pin: Component = () => {
	return (
		<div class="h-12 w-12 drop-shadow-[-3px_2px_5px_#000f]">
			<svg
				class="fill-brand-main dark:fill-brand-main"
				version="1.1"
				id="Capa_1"
				xmlns="http://www.w3.org/2000/svg"
				width="100%"
				height="100%"
				viewBox="0 0 340.001 340.001">
				<g>
					<g>
						<path
							class="fill-brand-100"
							d="M2.69,320.439c-3.768,4.305-3.553,10.796,0.494,14.842l1.535,1.536c4.047,4.046,10.537,4.262,14.842,0.493l105.377-92.199
			l-30.049-30.049L2.69,320.439z"
						/>
						<path
							d="M339.481,119.739c-0.359-1.118-9.269-27.873-50.31-68.912C248.133,9.788,221.377,0.878,220.262,0.52
			c-3.879-1.244-8.127-0.217-11.008,2.664l-40.963,40.963c-4.242,4.243-4.242,11.125,0,15.369l4.533,4.534L65.086,147.171
			c-2.473,1.909-4.006,4.79-4.207,7.908c-0.199,3.118,0.953,6.172,3.162,8.381l41.225,41.226l30.051,30.051l41.225,41.226
			c2.211,2.209,5.266,3.361,8.381,3.161c3.119-0.201,6-1.732,7.91-4.207l83.119-107.738l4.535,4.533
			c4.239,4.244,11.123,4.244,15.367,0l40.963-40.962C339.698,127.866,340.726,123.618,339.481,119.739z M187.751,109.478
			l-66.539,56.51c-4.346,3.691-10.75,3.372-14.713-0.589c-0.209-0.209-0.412-0.429-0.607-0.659
			c-3.883-4.574-3.324-11.434,1.25-15.318l66.537-56.509c4.574-3.886,11.428-3.333,15.318,1.249
			C192.882,98.735,192.322,105.595,187.751,109.478z"
						/>
					</g>
				</g>
			</svg>
		</div>
	);
};

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
