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
import type { CardInstance, User } from '@core/types';
import type { PackCardsHidden } from '@core/types';
import { Pack } from '@site/components/Pack';
import { transformPackTypeName } from '@site/lib/client/utils';
import { actions } from 'astro:actions';
import { Anchor, DeleteButton, Form, SubmitButton, TextArea } from '@site/components/Form';
import EditIcon from '@site/components/icons/EditIcon';
import type { TwitchUser } from '@core/lib/twitch';

export const UserPage: Component<{
	user: User;
	twitchData: TwitchUser | null;
	isLoggedInUser: boolean;
	packs: Array<PackCardsHidden>;
	cards: Array<CardInstance>;
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

				<section class="my-4 gap-4 text-left">
					<h2 class="font-display my-2 text-center text-4xl text-gray-800 dark:text-gray-200">
						Cards
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
					src={props.profileImageUrl}
					width={IMG_SIZE}
					height={IMG_SIZE}
					class="col-span-1 row-span-2 rounded-full"
				/>
				<h1 class="font-display col-start-2 mt-0 self-end text-2xl italic">
					{props.username}
				</h1>

				<Show when={props.lookingFor}>
					{lookingFor => (
						<UserLookingFor
							userId={props.userId}
							initialLookingFor={lookingFor()}
							isLoggedInUser={props.isLoggedInUser}
						/>
					)}
				</Show>

				<div class="col-start-2">
					<Show when={!props.isLoggedInUser}>
						<Anchor href={`${routes.TRADES}/new?receiverUsername=${props.username}`}>
							New Trade
						</Anchor>
					</Show>
				</div>
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
			class="relative col-start-2 grid max-h-32 max-w-80 gap-0 self-start overflow-hidden break-words pb-8 transition-all data-[open=true]:max-h-max">
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
		<div class="relative w-fit origin-top-left rotate-3 p-12">
			<a
				href={`${routes.USERS}/${props.username}/${props.card.instanceId}`}
				class="outline-brand-main group inline-block origin-[7rem_1rem] transition-transform ease-out hover:-rotate-3">
				<CardEls.TiltEffectWrapper transformOrigin="7rem 1rem" angleMultiplier={0.2}>
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
							<CardEls.CardDescription>{props.card.cardName}</CardEls.CardDescription>
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
							actions.packs
								.setIsLocked({
									packId: props.pack.packId,
									isLocked: newValue,
								})
								.then(val => {
									if (val.error) {
										setAlertText(
											'An error occurred while ' +
												(newValue == true ? 'lock' : 'unlock') +
												'ing the pack.'
										);
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
