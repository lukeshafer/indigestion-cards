import {
	default as CardList,
	filterCards,
	parseUniqueSeasons,
	PlaceholderCardList,
	type Filters,
} from '@site/components/CardList';
import { type SortInfo, getSortInfo } from '@site/lib/client/utils';
import {
	Show,
	For,
	Suspense,
	createResource,
	createSignal,
	type Component,
	type Setter,
	Switch,
	Match,
} from 'solid-js';
import { trpc } from '@site/lib/client/trpc';
import { routes, USER_API } from '@site/constants';
import { CardEls, cardUtils, FULL_ART_BACKGROUND_CSS } from '@site/components/Card';
import type { CardInstance, Collection, User } from '@core/types';
import type { PackCardsHidden } from '@core/types';
import { Pack } from '@site/components/Pack';
import { transformPackTypeName } from '@site/lib/client/utils';
import { Anchor, DeleteButton, Form, SubmitButton, TextArea } from '@site/components/Form';
import EditIcon from '@site/components/icons/EditIcon';
import type { TwitchUser } from '@core/lib/twitch';

export const UserPage: Component<{
	user: User;
	twitchData: TwitchUser | null;
	isLoggedInUser: boolean;
	packs: Array<PackCardsHidden>;
	cards: Array<CardInstance>;
	collectionData: Array<{ collection: Collection; cards: Array<CardInstance> }>;
	pinnedCard?: User['pinnedCard'];
	cursor: string | null;
	initialFilters: Filters;
}> = props => {
	return (
		<div class="md:flex md:max-h-[calc(100vh-10rem)]">
			<UserIdentitySection
				username={props.user.username}
				userId={props.user.userId}
				profileImageUrl={props.twitchData?.profile_image_url ?? ''}
				pinnedCard={props.user.pinnedCard}
				lookingFor={props.user.lookingFor}
				isLoggedInUser={props.isLoggedInUser}
			/>

			<div class="scrollbar-narrow h-full w-full md:overflow-scroll md:overflow-x-hidden">
				<Show when={props.packs.length > 0}>
					<section class="my-4 grid gap-4 text-center">
						<details>
							<summary class="ml-16 cursor-pointer py-4 text-left text-xl">
								<h2 class="font-display my-2 inline text-gray-800 dark:text-gray-200">
									Packs ({props.packs.length})
								</h2>
							</summary>
							<UserPackList
								packs={props.packs}
								isLoggedInUser={props.isLoggedInUser}
							/>
						</details>
					</section>
				</Show>

				<Show when={props.collectionData.length || props.isLoggedInUser}>
					<section class="mb-10">
						<header class="mb-6 grid place-items-center">
							<h2 class="font-display my-2 text-center text-4xl text-gray-800 dark:text-gray-200">
								Collections
							</h2>
							<Show when={props.isLoggedInUser}>
								<Anchor href="/collections/new">Create new</Anchor>
							</Show>
						</header>
						<ul
							class="grid justify-center"
							style={{ 'grid-template-columns': `repeat(auto-fill, 15rem)` }}>
							<For each={props.collectionData}>
								{({ collection, cards }) => (
									<li class="mb-2">
										<UserCollectionListItem
											user={props.user}
											collection={collection}
											previewCards={cards}
										/>
									</li>
								)}
							</For>
						</ul>
					</section>
				</Show>

				<section class="my-4 gap-4 text-left">
					<h2 class="font-display my-2 text-center text-4xl text-gray-800 dark:text-gray-200">
						{props.collectionData.length ? 'All Cards' : 'Cards'}
					</h2>
					<UserCardList
						initialCards={props.cards}
						username={props.user.username}
						initialCursor={props.cursor ?? undefined}
						pinnedCardId={props.user.pinnedCard?.instanceId}
						initialFilters={props.initialFilters}
					/>
				</section>
			</div>
		</div>
	);
};

const UserIdentitySection: Component<{
	username: string;
	userId: string;
	profileImageUrl: string;
	isLoggedInUser: boolean;
	lookingFor?: string;
	pinnedCard?: User['pinnedCard'];
}> = props => {
	const IMG_SIZE = 100;
	return (
		<div class="mx-auto w-fit min-w-96">
			<section
				style={{ 'grid-template-rows': `repeat(1,${IMG_SIZE / 2}px)` }}
				class="grid w-fit content-center gap-x-4">
				<img
					alt={`${props.username}'s profile image`}
					style={{ 'view-transition-name': `${props.userId}-user-profile-image` }}
					src={props.profileImageUrl}
					width={IMG_SIZE}
					height={IMG_SIZE}
					class="col-span-1 row-span-2 rounded-full"
				/>
				<h1 class="font-display col-start-2 mt-0 self-end text-2xl italic">
					{props.username}
				</h1>

				<Switch>
					<Match when={props.lookingFor}>
						{lookingFor => (
							<UserLookingFor
								userId={props.userId}
								initialLookingFor={lookingFor()}
								isLoggedInUser={props.isLoggedInUser}
							/>
						)}
					</Match>
					<Match when={!props.lookingFor && props.isLoggedInUser}>
						<UserLookingFor
							userId={props.userId}
							initialLookingFor={''}
							isLoggedInUser={props.isLoggedInUser}
						/>
					</Match>
				</Switch>

				<Show when={!props.isLoggedInUser}>
					<div class="col-start-2">
						<Anchor href={`${routes.TRADES}/new?receiverUsername=${props.username}`}>
							New Trade
						</Anchor>
					</div>
				</Show>
			</section>

			<Show when={props.pinnedCard}>
				{pinnedCard => <UserPinnedCard card={pinnedCard()} username={props.username} />}
			</Show>
		</div>
	);
};

const UserLookingFor: Component<{
	userId: string;
	initialLookingFor: string;
	isLoggedInUser: boolean;
}> = props => {
	const [isOpen, setIsOpen] = createSignal(false);
	const [isEditing, setIsEditing] = createSignal(false);
	const [lookingFor, setLookingFor] = createSignal(props.initialLookingFor);
	return (
		<p
			data-open={isOpen()}
			class="relative col-start-2 grid max-h-32 max-w-64 gap-0 self-start overflow-hidden break-words pb-2 transition-all data-[open=true]:max-h-max data-[open=true]:pb-8">
			<span class="flex gap-2 text-sm font-normal italic opacity-80">
				I'm looking for
				<Show when={props.isLoggedInUser && !isEditing()}>
					<button title="Edit looking for" onClick={() => setIsEditing(true)}>
						<EditIcon size={15} />
					</button>
				</Show>
			</span>
			<Switch>
				<Match when={!isEditing()}>
					<span class="block max-w-80 break-words text-lg font-normal leading-5">
						{lookingFor()}
					</span>
					<Show when={lookingFor().length > 40}>
						<button
							class="absolute bottom-0 h-8 w-full bg-gray-900/70 bg-gradient-to-t from-gray-900 to-gray-900/0"
							onClick={() => setIsOpen(v => !v)}>
							Show {isOpen() ? 'less' : 'more'}
						</button>
					</Show>
				</Match>
				<Match when={isEditing()}>
					<UserLookingForForm
						userId={props.userId}
						initialLookingFor={lookingFor()}
						onSubmit={newValue => {
							setLookingFor(newValue);
							setIsEditing(false);
						}}
						onCancel={() => setIsEditing(false)}
					/>
				</Match>
			</Switch>
		</p>
	);
};

const UserLookingForForm: Component<{
	userId: string;
	initialLookingFor: string;
	onSubmit: (value: string) => void;
	onCancel: () => void;
}> = props => {
	const [uiValue, setUIValue] = createSignal(props.initialLookingFor);

	return (
		<Form action={USER_API.USER} method="patch" onsubmit={() => props.onSubmit(uiValue())}>
			<input type="hidden" name="userId" value={props.userId} />
			<div class="block max-w-80 break-words text-lg font-normal leading-5">
				<TextArea
					inputOnly
					label="Looking For"
					name="lookingFor"
					value={uiValue()}
					maxLength={500}
					setValue={setUIValue}
					height="2rem"
				/>
			</div>
			<div class="flex items-center gap-2">
				<SubmitButton>Save</SubmitButton>
				<DeleteButton onClick={() => props.onCancel()}>Cancel</DeleteButton>
			</div>
		</Form>
	);
};

const UserPinnedCard: Component<{
	card: NonNullable<User['pinnedCard']>;
	username: string;
}> = props => {
	return (
		<div class="relative w-fit pt-8">
			<p class="text-center text-gray-500">Pinned</p>
			<a
				href={`${routes.USERS}/${props.username}/${props.card.instanceId}`}
				class="outline-brand-main group inline-block origin-[7rem_1rem] transition-transform ease-out">
				<CardEls.TiltEffectWrapper angleMultiplier={1.5}>
					<CardEls.GlowOnHover focusOnly color={props.card.rarityColor} />
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
						<Show when={cardUtils.checkIfCanShowCardText(props.card.rarityId)}>
							<CardEls.CardName>{props.card.cardName}</CardEls.CardName>
							<CardEls.CardDescription>
								{props.card.cardDescription}
							</CardEls.CardDescription>
						</Show>
						<Show when={!cardUtils.checkIsLegacyCard(props.card.rarityId)}>
							<CardEls.CardNumber
								color={
									cardUtils.checkIsFullArt(props.card.rarityId)
										? 'white'
										: 'black'
								}>
								{cardUtils.formatCardNumber(props.card)}
							</CardEls.CardNumber>
						</Show>
						<Show when={cardUtils.checkIsShitPack(props.card.stamps)}>
							<CardEls.ShitStamp
								src={cardUtils.getShitStampPath(props.card.rarityId)}
							/>
						</Show>
					</CardEls.Card>
					<CardEls.ShineMouseEffect />
				</CardEls.TiltEffectWrapper>
			</a>
		</div>
	);
};

const UserCollectionListItem: Component<{
	user: User;
	collection: Collection;
	previewCards: Array<CardInstance>;
}> = props => {
	const firstCard = () => props.previewCards.at(0);
	const secondCard = () => props.previewCards.at(1);
	const thirdCard = () => props.previewCards.at(2);

	return (
		<a
			class="group grid w-60 place-items-center"
			href={`${routes.USERS}/${props.user.username.toLowerCase()}/collections/${props.collection.collectionId}`}>
			<div class="relative mx-6 my-4 w-fit px-8 transition-all group-hover:px-9">
				<div class="absolute bottom-0 right-0 z-10 rotate-12 shadow-xl">
					<Show when={props.previewCards.length >= 2 && firstCard()}>
						{card => <UserCollectionListItemPreviewCard card={card()} />}
					</Show>
				</div>
				<div
					classList={{
						'brightness-100': props.previewCards.length == 1,
						'brightness-90 shadow-xl': props.previewCards.length >= 3,
					}}>
					<Show
						when={
							(props.previewCards.length >= 3 && secondCard()) ||
							(props.previewCards.length == 1 && firstCard())
						}
						fallback={<div class="card-aspect-ratio relative w-[calc(18em*0.4)]" />}>
						{card => <UserCollectionListItemPreviewCard card={card()} />}
					</Show>
				</div>
				<div
					class="absolute bottom-0 left-0 -z-10 -rotate-12"
					classList={{
						'brightness-75': props.previewCards.length >= 3,
						'brightness-90': props.previewCards.length === 2,
					}}>
					<Show
						when={
							(props.previewCards.length >= 3 && thirdCard()) ||
							(props.previewCards.length === 2 && secondCard())
						}>
						{card => <UserCollectionListItemPreviewCard card={card()} />}
					</Show>
				</div>
			</div>
			<h3 class="z-10 text-lg font-semibold">{props.collection.collectionName}</h3>
		</a>
	);
};

const UserCollectionListItemPreviewCard: Component<{
	card: {
		cardName: string;
		cardDescription: string;
		designId: string;
		rarityId: string;
		instanceId: string;
		rarityColor: string;
		cardNumber: number;
		totalOfType: number;
		stamps?: Array<string>;
	};
}> = props => {
	return (
		<CardEls.Card
			lazy={false}
			scale={0.4}
			alt={props.card.cardName}
			imgSrc={cardUtils.getCardImageUrl(props.card)}
			viewTransitionName={`card-${props.card.instanceId}-collection-preview`}
			background={
				cardUtils.checkIsFullArt(props.card.rarityId)
					? FULL_ART_BACKGROUND_CSS
					: props.card.rarityColor
			}>
			<Show when={cardUtils.checkIfCanShowCardText(props.card.rarityId)}>
				<CardEls.CardName>{props.card.cardName}</CardEls.CardName>
				<CardEls.CardDescription>{props.card.cardDescription}</CardEls.CardDescription>
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

const UserCardList: Component<{
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
				<CardList.Filter
					params={{
						seasons: parseUniqueSeasons(cardsResource.latest),
						minterId: true,
					}}
					setFilters={setFilters}
					ssrFilters={/*@once*/ props.initialFilters}
				/>
			</CardList.Menu>
			<Suspense fallback={<PlaceholderCardList scale={0.7} length={12} />}>
				<CardList.List cards={filteredCards() ?? []} scale={0.7}>
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
		<CardEls.FullAnimatedCardEffect
			glowColor={
				cardUtils.checkIsFullArt(props.card.rarityId) ? undefined : props.card.rarityColor
			}>
			<CardEls.Card
				lazy={props.lazy}
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
					<CardEls.CardDescription>{props.card.cardDescription}</CardEls.CardDescription>
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
		</CardEls.FullAnimatedCardEffect>
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

const UserPackList: Component<{
	packs: Array<PackCardsHidden>;
	isLoggedInUser: boolean;
}> = props => {
	return (
		<ul
			class="grid w-full justify-center justify-items-center gap-x-2 gap-y-14 px-3 [--card-scale:0.75] md:gap-x-6"
			style={{
				'grid-template-columns':
					'repeat(auto-fit, minmax(auto, calc(var(--card-scale) * 18rem)))',
				//'repeat(auto-fill, minmax(calc(var(--card-scale) * 18rem), 1fr))',
			}}>
			<For each={props.packs}>
				{pack => <PackListItem pack={pack} canChangeLock={props.isLoggedInUser} />}
			</For>
		</ul>
	);
};

const PackListItem: Component<{ pack: PackCardsHidden; canChangeLock: boolean }> = props => {
	const [isLocked, setIsLocked] = createSignal(props.pack.isLocked || false);
	const [alertText, setAlertText] = createSignal<string | false>(false);

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
			<Show when={alertText()}>
				{message => (
					<ErrorAlert text={message()} hide={() => setAlertText(false)}></ErrorAlert>
				)}
			</Show>
			<Show when={props.canChangeLock}>
				<div class="absolute left-2 top-7">
					<LockButton
						isLocked={isLocked()}
						onClick={() => {
							let newValue = !isLocked();
							trpc.packs.setIsLocked
								.mutate({
									packId: props.pack.packId,
									isLocked: newValue,
								})
								.catch(() => {
									setAlertText(
										'An error occurred while ' +
											(newValue == true ? 'lock' : 'unlock') +
											'ing the pack.'
									);
									setIsLocked(!newValue);
								});
							setIsLocked(newValue);
						}}
					/>
				</div>
			</Show>
		</li>
	);
};

const ErrorAlert: Component<{
	hide: () => void;
	text: string;
}> = props => {
	const DURATION = 3000;
	return (
		<p
			class="absolute inset-0 bg-black/50 pt-32 text-xl opacity-100 transition-opacity ease-in-out data-[hiding=true]:opacity-0"
			data-hiding="false"
			style={{
				'transition-duration': `${DURATION}ms`,
			}}
			ref={p =>
				setTimeout(() => {
					p.dataset.hiding = 'true';
					setTimeout(() => props.hide(), DURATION);
				}, 1000)
			}>
			{props.text}
		</p>
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
