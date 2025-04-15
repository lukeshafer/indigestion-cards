import CardList, {
	filterCards,
	parseUniqueSeasons,
	PlaceholderCardList,
	type Filters,
} from '@site/components/CardList';
import { getSortInfo, type SortInfo } from '@site/client/card-sort';
import * as Solid from 'solid-js';
import { trpc } from '@site/client/api';
import { routes } from '@site/constants';
import {
	CardEls,
	CardInstanceComponent,
	cardUtils,
	FULL_ART_BACKGROUND_CSS,
} from '@site/components/Card';
import type { CardInstance, Collection, User } from '@core/types';
import type { PackCardsHidden } from '@core/types';
import { Pack, formatPackNumber } from '@site/components/Pack';
import { transformPackTypeName } from '@site/client/utils';
import { Anchor, DeleteButton, SubmitButton, TextArea, TextInput } from '@site/components/Form';
import EditIcon from '@site/components/icons/EditIcon';
import type { TwitchUser } from '@core/lib/twitch';
import { pushAlert } from '@site/client/state';
import { createMutableProp } from '@site/client/reactive';
import { formatCollectionViewTransitionId } from '@site/components/Collections';
import type { UserCardsSummaryDesign } from '@core/lib/user';

const UserPageContext = Solid.createContext({
	user: {} as User,
	loggedInUserId: undefined as string | undefined,
	twitchData: null as TwitchUser | null,
	packs: [] as Array<PackCardsHidden>,
	cards: [] as Array<CardInstance>,
	view: 'all' as UserCardsView,
});

type UserCardsView = 'all' | 'season';

export const UserPage: Solid.Component<{
	user: User;
	twitchData: TwitchUser | null;
	loggedInUserId?: string;
	packs: Array<PackCardsHidden>;
	cards: Array<CardInstance>;
	collectionData: Array<{ collection: Collection; cards: Array<CardInstance> }>;
	pinnedCard?: User['pinnedCard'];
	cursor: string | null;
	initialFilters: Filters;
}> = props => {
	const [view, setView] = Solid.createSignal<UserCardsView>('all');

	return (
		<UserPageContext.Provider
			value={{
				get user() {
					return props.user;
				},
				get twitchData() {
					return props.twitchData;
				},
				get loggedInUserId() {
					return props.loggedInUserId;
				},
				get packs() {
					return props.packs;
				},
				get cards() {
					return props.cards;
				},
				get view() {
					return view();
				},
				set view(value) {
					setView(value);
				},
			}}>
			<div class="h-fit md:flex">
				<div class="md:h-full">
					<UserIdentitySection />
				</div>

				<div class="h-full w-full">
					<Solid.Show when={props.packs.length > 0}>
						<section class="my-4 grid gap-4 text-center">
							<UserPackList />
						</section>
					</Solid.Show>

					<section class="my-4 grid gap-4 text-center">
						<UserMomentList />
					</section>

					<Solid.Show
						when={
							props.collectionData.length ||
							props.loggedInUserId === props.user.userId
						}>
						<section class="mb-10">
							<header class="mb-6 grid place-items-center">
								<h2 class="font-display my-2 text-center text-4xl text-gray-800 dark:text-gray-200">
									Collections
								</h2>
								<Solid.Show when={props.loggedInUserId === props.user.userId}>
									<Anchor href="/collections/new">Create new</Anchor>
								</Solid.Show>
							</header>
							<ul
								class="grid justify-center"
								style={{ 'grid-template-columns': `repeat(auto-fill, 15rem)` }}>
								<Solid.For each={props.collectionData}>
									{({ collection, cards }) => (
										<li class="mb-2">
											<UserCollectionListItem
												collection={collection}
												previewCards={cards}
											/>
										</li>
									)}
								</Solid.For>
							</ul>
						</section>
					</Solid.Show>

					<section class="my-4 gap-4 text-left">
						<h2 class="font-display my-2 text-center text-4xl text-gray-800 dark:text-gray-200">
							Cards
						</h2>
						<CardListViewSelector />
						<Solid.Switch>
							<Solid.Match when={view() === 'all'}>
								<UserCardList
									initialCursor={props.cursor ?? undefined}
									initialFilters={props.initialFilters}
								/>
							</Solid.Match>
							<Solid.Match when={view() === 'season'}>
								<CardsSeasonViewList />
							</Solid.Match>
						</Solid.Switch>
					</section>
				</div>
			</div>
		</UserPageContext.Provider>
	);
};

const UserIdentitySection: Solid.Component = () => {
	const IMG_SIZE = 100;

	const ctx = Solid.useContext(UserPageContext);

	return (
		<div
			class="scrollbar-narrow top-8 mx-auto w-fit min-w-96 overflow-y-scroll pb-4 md:sticky"
			ref={setupHeightCorrection}>
			<section
				style={{ 'grid-template-rows': `repeat(1,${IMG_SIZE / 2}px)` }}
				class="grid w-fit content-center gap-x-4">
				<img
					alt={`${ctx.user.username}'s profile image`}
					style={{ 'view-transition-name': `${ctx.user.userId}-user-profile-image` }}
					src={ctx.twitchData?.profile_image_url}
					width={IMG_SIZE}
					height={IMG_SIZE}
					class="col-span-1 row-span-2 rounded-full"
				/>
				<h1 class="font-display col-start-2 mt-0 self-end text-2xl italic">
					{ctx.user.username}
				</h1>

				<Solid.Switch>
					<Solid.Match
						when={ctx.user.lookingFor || ctx.loggedInUserId === ctx.user.userId}>
						<UserLookingFor />
					</Solid.Match>
				</Solid.Switch>

				<Solid.Show when={ctx.loggedInUserId && ctx.loggedInUserId !== ctx.user.userId}>
					<div class="col-start-2">
						<Anchor href={`${routes.TRADES}/new?receiverUsername=${ctx.user.username}`}>
							New Trade
						</Anchor>
					</div>
				</Solid.Show>
			</section>

			<Solid.Show when={ctx.user.pinnedCard?.instanceId !== '' && ctx.user.pinnedCard}>
				{pinnedCard => (
					<UserPinnedCard
						card={pinnedCard()}
						message={ctx.user.pinnedMessage ?? ''}
						username={ctx.user.username}
						isLoggedInUser={ctx.loggedInUserId === ctx.user.userId}
					/>
				)}
			</Solid.Show>
		</div>
	);
};

function setupHeightCorrection(el: HTMLElement) {
	const initialHeight = el.getBoundingClientRect().height;
	const adjustElHeight = () => {
		let domRect = el.getBoundingClientRect();

		if (domRect.bottom > window.innerHeight) {
			let delta = domRect.bottom - window.innerHeight;
			el.style.height = `${domRect.height - delta}px`;
		} else if (domRect.height < initialHeight) {
			let delta = window.innerHeight - domRect.bottom;
			let newH = domRect.height + delta;

			if (newH > initialHeight) {
				el.style.height = '100%';
			} else {
				el.style.height = `${newH}px`;
			}
		}
	};

	window.addEventListener('resize', adjustElHeight);
	window.addEventListener('scroll', adjustElHeight);

	Solid.onCleanup(() => {
		window.removeEventListener('resize', adjustElHeight);
		window.removeEventListener('scroll', adjustElHeight);
	});
}

const UserLookingFor: Solid.Component = () => {
	const ctx = Solid.useContext(UserPageContext);

	const [isOpen, setIsOpen] = Solid.createSignal(false);
	const [isEditing, setIsEditing] = Solid.createSignal(false);
	const [lookingFor, setLookingFor] = createMutableProp(() => ctx.user.lookingFor || '');
	return (
		<p
			data-open={isOpen() || isEditing()}
			class="relative col-start-2 grid max-h-64 max-w-64 gap-0 self-start overflow-hidden break-words pb-2 transition-all data-[open=true]:max-h-max data-[open=true]:pb-8">
			<span class="flex gap-2 text-sm font-normal italic opacity-80">
				I'm looking for
				<Solid.Show when={ctx.loggedInUserId === ctx.user.userId && !isEditing()}>
					<button title="Edit looking for" onClick={() => setIsEditing(true)}>
						<EditIcon size={15} />
					</button>
				</Solid.Show>
			</span>
			<Solid.Switch>
				<Solid.Match when={!isEditing()}>
					<span class="block max-w-80 break-words text-lg font-normal leading-5">
						{lookingFor()}
					</span>
					<Solid.Show when={lookingFor().length > 250}>
						<button
							class="absolute bottom-0 h-8 w-full bg-gray-100/70 bg-gradient-to-t from-gray-100 to-gray-100/0 dark:bg-gray-900/70 dark:from-gray-900 dark:to-gray-900/0"
							onClick={() => setIsOpen(v => !v)}>
							Show {isOpen() ? 'less' : 'more'}
						</button>
					</Solid.Show>
				</Solid.Match>
				<Solid.Match when={isEditing()}>
					<UserLookingForForm
						userId={ctx.user.userId}
						initialLookingFor={lookingFor()}
						onSubmit={newValue => {
							setLookingFor(newValue);
							setIsEditing(false);
						}}
						onCancel={() => setIsEditing(false)}
					/>
				</Solid.Match>
			</Solid.Switch>
		</p>
	);
};

const UserLookingForForm: Solid.Component<{
	userId: string;
	initialLookingFor: string;
	onSubmit: (value: string) => void;
	onCancel: () => void;
}> = props => {
	const [uiValue, setUIValue] = Solid.createSignal(props.initialLookingFor);

	return (
		<form
			onSubmit={async e => {
				e.preventDefault();
				trpc.users.update
					.mutate({
						lookingFor: uiValue(),
					})
					.then(() => pushAlert({ message: 'Updated profile.', type: 'success' }))
					.catch(() => pushAlert({ message: 'An error occurred.', type: 'error' }));
				props.onSubmit(uiValue());
			}}>
			<div class="block max-w-80 break-words px-1 text-lg font-normal leading-5">
				<TextArea
					inputOnly
					label="Looking For"
					name="lookingFor"
					value={uiValue()}
					maxLength={500}
					setValue={setUIValue}
					height="6rem"
				/>
			</div>
			<div class="flex items-center gap-2">
				<SubmitButton>Save</SubmitButton>
				<DeleteButton onClick={() => props.onCancel()}>Cancel</DeleteButton>
			</div>
		</form>
	);
};

const UserPinnedCard: Solid.Component<{
	card: NonNullable<User['pinnedCard']>;
	isLoggedInUser: boolean;
	message: string;
	username: string;
}> = props => {
	return (
		<div class="relative mx-auto w-fit pt-8">
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
						<Solid.Show when={cardUtils.checkIfCanShowCardText(props.card.rarityId)}>
							<CardEls.CardName>{props.card.cardName}</CardEls.CardName>
							<CardEls.CardDescription>
								{props.card.cardDescription}
							</CardEls.CardDescription>
						</Solid.Show>
						<Solid.Show when={!cardUtils.checkIsLegacyCard(props.card.rarityId)}>
							<CardEls.CardNumber
								color={
									cardUtils.checkIsFullArt(props.card.rarityId)
										? 'white'
										: 'black'
								}>
								{cardUtils.formatCardNumber(props.card)}
							</CardEls.CardNumber>
						</Solid.Show>
						<Solid.Show when={cardUtils.checkIsShitPack(props.card.stamps)}>
							<CardEls.ShitStamp
								src={cardUtils.getShitStampPath(props.card.rarityId)}
							/>
						</Solid.Show>
					</CardEls.Card>
					<CardEls.ShineMouseEffect />
				</CardEls.TiltEffectWrapper>
			</a>
			<Solid.Show when={props.message.length || props.isLoggedInUser}>
				<UserPinnedMessage message={props.message} isLoggedInUser={props.isLoggedInUser} />
			</Solid.Show>
		</div>
	);
};

const UserPinnedMessage: Solid.Component<{
	message: string;
	isLoggedInUser: boolean;
}> = props => {
	const [message, setMessage] = createMutableProp(() => props.message);
	const [isEditing, setIsEditing] = Solid.createSignal(false);
	let prevMessage = '';
	return (
		<p class="relative col-start-2 grid gap-0 self-start break-words">
			<Solid.Show when={props.isLoggedInUser}>
				<span class="mx-auto flex gap-2 text-sm font-normal italic opacity-80">
					Say something about your pinned card
					<Solid.Show when={!isEditing()}>
						<button
							title="Edit pinned message"
							onClick={() => {
								prevMessage = message();
								setIsEditing(true);
							}}>
							<EditIcon size={15} />
						</button>
					</Solid.Show>
				</span>
			</Solid.Show>
			<Solid.Switch>
				<Solid.Match when={!isEditing()}>
					<span class="block max-w-80 break-words text-center font-normal leading-5">
						{message()}
					</span>
				</Solid.Match>
				<Solid.Match when={isEditing()}>
					<form
						class="grid gap-2"
						onSubmit={e => {
							e.preventDefault();

							trpc.users.update
								.mutate({ pinnedMessage: message() })
								.then(() =>
									pushAlert({ message: 'Updated profile.', type: 'success' })
								)
								.catch(() =>
									pushAlert({ message: 'An error occurred.', type: 'error' })
								);

							setIsEditing(false);
						}}>
						<div class="block max-w-80 break-words px-1 text-lg font-normal leading-5">
							<TextInput
								inputOnly
								label="Add a pinned message"
								name="pinnedMsg"
								maxLength={120}
								value={message()}
								setValue={setMessage}
							/>
						</div>
						<div class="flex items-center gap-2">
							<SubmitButton>Save</SubmitButton>
							<DeleteButton
								onClick={() => {
									setMessage(prevMessage);
									setIsEditing(false);
								}}>
								Cancel
							</DeleteButton>
						</div>
					</form>
				</Solid.Match>
			</Solid.Switch>
		</p>
	);
};

const UserCollectionListItem: Solid.Component<{
	collection: Collection;
	previewCards: Array<CardInstance>;
}> = props => {
	const ctx = Solid.useContext(UserPageContext);

	const firstCard = () => props.previewCards.at(0);
	const secondCard = () => props.previewCards.at(1);
	const thirdCard = () => props.previewCards.at(2);

	return (
		<a
			class="group grid w-60 place-items-center"
			href={`${routes.USERS}/${ctx.user.username.toLowerCase()}/collections/${props.collection.collectionId}`}>
			<div class="relative mx-6 my-4 w-fit px-8 transition-all group-hover:px-9">
				<div class="absolute bottom-0 left-0 z-10 -rotate-12">
					<Solid.Show when={props.previewCards.length >= 2 && firstCard()}>
						{card => (
							<UserCollectionListItemPreviewCard
								card={card()}
								collectionId={props.collection.collectionId}
							/>
						)}
					</Solid.Show>
				</div>
				<div
					classList={{
						'brightness-100': props.previewCards.length == 1,
						'brightness-90 shadow-xl': props.previewCards.length >= 3,
					}}>
					<Solid.Show
						when={
							(props.previewCards.length >= 3 && secondCard()) ||
							(props.previewCards.length == 1 && firstCard())
						}
						fallback={<div class="card-aspect-ratio relative w-[calc(18em*0.4)]" />}>
						{card => (
							<UserCollectionListItemPreviewCard
								card={card()}
								collectionId={props.collection.collectionId}
							/>
						)}
					</Solid.Show>
				</div>
				<div
					class="absolute bottom-0 right-0 -z-10 rotate-12 shadow-xl"
					classList={{
						'brightness-75': props.previewCards.length >= 3,
						'brightness-90': props.previewCards.length === 2,
					}}>
					<Solid.Show
						when={
							(props.previewCards.length >= 3 && thirdCard()) ||
							(props.previewCards.length === 2 && secondCard())
						}>
						{card => (
							<UserCollectionListItemPreviewCard
								card={card()}
								collectionId={props.collection.collectionId}
							/>
						)}
					</Solid.Show>
				</div>
			</div>
			<h3 class="z-10 text-lg font-semibold">{props.collection.collectionName}</h3>
		</a>
	);
};

const UserCollectionListItemPreviewCard: Solid.Component<{
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
	collectionId: string;
}> = props => {
	return (
		<CardEls.Card
			lazy={false}
			scale={0.4}
			alt={props.card.cardName}
			imgSrc={cardUtils.getCardImageUrl(props.card)}
			viewTransitionName={formatCollectionViewTransitionId({
				cardId: props.card.instanceId,
				collectionId: props.collectionId,
			})}
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

const UserCardList: Solid.Component<{
	initialFilters: Filters;
	initialCursor?: string;
}> = props => {
	const ctx = Solid.useContext(UserPageContext);

	const [nextCursor, setNextCursor] = Solid.createSignal(props.initialCursor ?? null);
	const [sortInfo, setSortInfo] = Solid.createSignal<SortInfo>({
		by: 'rarity',
		isReversed: false,
	});
	const [filters, setFilters] = Solid.createSignal(props.initialFilters);
	const [searchText, setSearchText] = Solid.createSignal('');

	const [cardsResource, { mutate: mutateCards }] = Solid.createResource(
		() => ({
			sortInfo: sortInfo(),
			username: ctx.user.username,
			setNextCursor,
			pinnedCardId: ctx.user.pinnedCard?.instanceId,
			searchText: searchText(),
		}),
		queryCards,
		{ initialValue: ctx.cards, ssrLoadFrom: 'initial' }
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
					setSort={sortType => setSortInfo(getSortInfo(sortType))}
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
			<Solid.Suspense fallback={<PlaceholderCardList scale={0.7} length={12} />}>
				<CardList.List cards={filteredCards() ?? []} scale={0.7}>
					{(card, index) => <UserCardListItem card={card} lazy={index() > 10} />}
				</CardList.List>
				<Solid.Show when={nextCursor() && !searchText()}>
					<CardList.LoadButton
						load={() =>
							queryCards({
								username: ctx.user.username,
								sortInfo: sortInfo(),
								cursor: nextCursor() || undefined,
								setNextCursor,
								searchText: '',
							}).then(result => mutateCards(cards => [...(cards ?? []), ...result]))
						}>
						Load more cards
					</CardList.LoadButton>
				</Solid.Show>
			</Solid.Suspense>
		</div>
	);
};

const UserCardListItem: Solid.Component<{
	card: CardInstance;
	lazy: boolean;
}> = props => (
	<a
		href={`${routes.USERS}/${props.card.username}/${props.card.instanceId ?? ''}`}
		class="outline-brand-main group inline-block transition-transform hover:-translate-y-2">
		<CardEls.FullAnimatedCardEffect
			disableTiltOnTouch
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
		</CardEls.FullAnimatedCardEffect>
	</a>
);

async function queryCards(opts: {
	sortInfo: SortInfo;
	username: string;
	cursor?: string;
	pinnedCardId?: string;
	setNextCursor: Solid.Setter<string | null>;
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
		excludeMoments: true,
	});

	opts.setNextCursor(result.cursor);
	return result.data;
}

const UserPackList: Solid.Component = () => {
	const ctx = Solid.useContext(UserPageContext);

	return (
		<details>
			<summary class="ml-16 cursor-pointer py-2 text-left text-xl">
				<h2 class="font-display my-2 inline text-gray-800 dark:text-gray-200">
					Packs ({ctx.packs.length})
				</h2>
			</summary>
			<ul
				class="grid w-full justify-center justify-items-center gap-x-2 gap-y-14 px-3 [--card-scale:0.75] md:gap-x-6"
				style={{
					'grid-template-columns':
						'repeat(auto-fit, minmax(auto, calc(var(--card-scale) * 18rem)))',
					//'repeat(auto-fill, minmax(calc(var(--card-scale) * 18rem), 1fr))',
				}}>
				<Solid.For each={ctx.packs}>
					{pack => (
						<PackListItem
							pack={pack}
							canChangeLock={ctx.loggedInUserId === ctx.user.userId}
						/>
					)}
				</Solid.For>
			</ul>
		</details>
	);
};

const PackListItem: Solid.Component<{ pack: PackCardsHidden; canChangeLock: boolean }> = props => {
	const [isLocked, setIsLocked] = createMutableProp(() => props.pack.isLocked || false);
	const [alertText, setAlertText] = Solid.createSignal<string | false>(false);

	return (
		<li class="relative w-fit">
			<Pack
				name={transformPackTypeName(props.pack.packTypeName)}
				packNumber={formatPackNumber(props.pack)}
				scale={0.8}
			/>

			<Solid.Show when={isLocked()}>
				<div class="absolute inset-0 bg-white/50 dark:bg-black/50">
					<p class="my-14">
						<span class="block text-xl">Locked.</span>Cannot be opened.
					</p>
				</div>
			</Solid.Show>
			<Solid.Show when={alertText()}>
				{message => (
					<ErrorAlert text={message()} hide={() => setAlertText(false)}></ErrorAlert>
				)}
			</Solid.Show>
			<Solid.Show when={props.canChangeLock}>
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
			</Solid.Show>
		</li>
	);
};

const UserMomentList: Solid.Component = () => {
	const ctx = Solid.useContext(UserPageContext);

	const [moments, { refetch }] = Solid.createResource<Array<CardInstance>>(
		() => trpc.userCards.moments.query({ username: ctx.user.username }),
		{
			initialValue: [],
			ssrLoadFrom: 'initial',
		}
	);

	Solid.onMount(refetch);

	return (
		<Solid.Suspense>
			<div class="min-h-12">
				<Solid.Show when={moments.latest.length}>
					<details>
						<summary class="ml-16 cursor-pointer py-2 text-left text-xl">
							<h2 class="font-display my-2 inline text-gray-800 dark:text-gray-200">
								Moments
							</h2>
						</summary>

						<CardList.List cards={moments.latest} scale={0.7}>
							{card => (
								<a
									href={`${routes.USERS}/${card.username}/${card.instanceId}`}
									class="outline-brand-main group inline-block transition-transform hover:-translate-y-2">
									<CardEls.FullAnimatedCardEffect
										disableTiltOnTouch
										glowColor={card.rarityColor}>
										<CardEls.Card
											lazy={true}
											alt={card.cardName}
											imgSrc={cardUtils.getCardImageUrl(card)}
											viewTransitionName={`card-${card.instanceId}`}
											background={card.rarityColor}>
											<CardEls.CardName>{card.cardName}</CardEls.CardName>
											<CardEls.CardDescription>
												{card.cardDescription}
											</CardEls.CardDescription>
											<CardEls.CardNumber color="black">
												{cardUtils.formatCardNumber(card)}
											</CardEls.CardNumber>
										</CardEls.Card>
									</CardEls.FullAnimatedCardEffect>
								</a>
							)}
						</CardList.List>
					</details>
				</Solid.Show>
			</div>
		</Solid.Suspense>
	);
};

const ErrorAlert: Solid.Component<{
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

const LockButton: Solid.Component<{ isLocked: boolean; onClick: () => void }> = props => {
	const [mouseDown, setMouseDown] = Solid.createSignal(false);
	const [isHovering, setIsHovering] = Solid.createSignal(false);

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

const Lock: Solid.Component<{ isLocked: boolean }> = props => (
	<div
		class="group relative block h-6 w-7 cursor-pointer rounded border-2 border-[--lock-color] transition-all duration-100 ease-in-out [--lock-color:black] data-[unlocked=true]:rotate-12 data-[unlocked=true]:hover:rotate-3 dark:[--lock-color:white]"
		data-unlocked={!props.isLocked}>
		<div class="absolute bottom-full left-1/2 h-4 w-5 -translate-x-1/2 rounded-tl-full rounded-tr-full border-2 border-b-0 border-[--lock-color] transition-all duration-100 ease-in-out group-data-[unlocked=true]:bottom-[130%] group-data-[unlocked=true]:left-1/4 group-data-[unlocked=true]:-rotate-[30deg] group-data-[unlocked=true]:group-hover:bottom-[124%] group-data-[unlocked=true]:group-hover:left-1/3 group-data-[unlocked=false]:group-hover:h-5 group-data-[unlocked=true]:group-hover:-rotate-[20deg]" />
		<div class="absolute left-1/2 top-1/2 h-2 w-1 -translate-x-1/2 -translate-y-1/2 bg-[--lock-color] transition-all duration-100 ease-in-out"></div>
	</div>
);

const CardListViewSelector: Solid.Component = () => {
	const ctx = Solid.useContext(UserPageContext);

	return (
		<fieldset class="m-4 flex justify-center data-[hidden]:hidden" data-hidden>
			<label
				class="data-[checked=true]:bg-brand-light dark:data-[checked=true]:bg-brand-main focus-within:outline-brand-main flex w-full max-w-60 cursor-pointer justify-end gap-2 rounded-l-full bg-gray-200 px-2 text-right font-light text-gray-500 focus-within:z-10 focus-within:outline data-[checked=true]:font-semibold data-[checked=true]:text-black dark:bg-gray-800 dark:font-light dark:data-[checked=true]:font-semibold"
				data-checked={ctx.view === 'all'}>
				<input
					type="radio"
					name="listView"
					value="all"
					class="sr-only"
					checked={ctx.view === 'all'}
					onChange={() => (ctx.view = 'all')}
				/>
				<p>Standard View</p>
			</label>
			<label
				class="data-[checked=true]:bg-brand-light dark:data-[checked=true]:bg-brand-main focus-within:outline-brand-main flex w-full max-w-60 cursor-pointer justify-start gap-2 rounded-r-full bg-gray-200 px-2 font-light text-gray-500 focus-within:outline data-[checked=true]:font-semibold data-[checked=true]:text-black dark:bg-gray-800 dark:font-light dark:data-[checked=true]:font-semibold"
				data-checked={ctx.view === 'season'}>
				<input
					type="radio"
					name="listView"
					value="season"
					class="sr-only"
					checked={ctx.view === 'season'}
					onChange={() => (ctx.view = 'season')}
				/>
				<p>Collector View</p>
			</label>
		</fieldset>
	);
};

const CardsSeasonViewList: Solid.Component = () => {
	const ctx = Solid.useContext(UserPageContext);

	const [data, resource] = Solid.createResource(
		() => ctx.user.username,
		async username => await trpc.userCards.summary.query({ username }),
		{
			initialValue: {
				userId: ctx.user.userId,
				username: ctx.user.username,
				seasons: [],
			},
			ssrLoadFrom: 'initial',
		}
	);

	Solid.onMount(() => {
		resource.refetch();
	});

	return (
		<Solid.Suspense
			fallback={
				<div class="py-8">
					<PlaceholderCardList scale={0.8} length={12} />
				</div>
			}>
			<div>
				<Solid.For each={data().seasons}>
					{season => (
						<section class="p-4">
							<h3 class="font-display p-4 text-center text-2xl font-bold my-4">
								{season.seasonName}
							</h3>
							<CardList.List cards={season.designs} scale={0.8}>
								{design => (
									<li>
										<Solid.Switch>
											<Solid.Match when={design.cards.length > 0}>
												<CardsSeasonViewListItem design={design} />
											</Solid.Match>
											<Solid.Match when={design.cards.length === 0}>
												<CardsSeasonViewListEmptyItem design={design} />
											</Solid.Match>
										</Solid.Switch>
									</li>
								)}
							</CardList.List>
						</section>
					)}
				</Solid.For>
			</div>
		</Solid.Suspense>
	);
};

const CardsSeasonViewListItem: Solid.Component<{
	design: UserCardsSummaryDesign;
}> = props => {
	const ctx = Solid.useContext(UserPageContext);
	const card = Solid.createMemo(() => props.design.cards[0]);

	return (
		<a
			href={`${routes.USERS}/${ctx.user.username}/designs/${props.design.designId}`}
			class="outline-brand-main group relative inline-block transition-transform">
			<Solid.For each={props.design.cards.slice(1, 5)}>
				{(card, index) => (
					<div
						class="absolute transition-transform group-hover:-translate-y-4 ease-out"
						style={{
							'z-index': -index(),
							'transition-delay': `${50 * (index() + 1)}ms`,

							'--pos': `-${4 * (index() + 1)}px`,
							top: 'var(--pos)',
							right: 'var(--pos)',

							'--level': 0.8 - index() * 0.2,
							opacity: 'var(--level)',
							filter: `brightness(var(--level))`,
						}}>
						<CardInstanceComponent card={{ ...props.design, ...card }} lazy={true} />
					</div>
				)}
			</Solid.For>
			<div class="transition-transform group-hover:-translate-y-4 ease-out">
				<CardEls.GlowOnHover
					color={
						cardUtils.checkIsFullArt(card().rarityId) ? undefined : card().rarityColor
					}
				/>
				<CardInstanceComponent card={{ ...props.design, ...card() }} lazy={false} />
			</div>
		</a>
	);
};
const CardsSeasonViewListEmptyItem: Solid.Component<{
	design: UserCardsSummaryDesign;
}> = props => {
	return (
		<div class="group relative inline-block transition-transform">
			<CardEls.Card
				noShadow
				lazy={false}
				alt={props.design.cardName}
				imgSrc={null}
				viewTransitionName={undefined}
				background={undefined}>
				<div class="grid h-full w-full place-items-center border-8 border-dashed border-gray-400 text-xl text-gray-400 dark:border-gray-600 dark:text-gray-600">
					{props.design.cardName}
				</div>
			</CardEls.Card>
		</div>
	);
};
