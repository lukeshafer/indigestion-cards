import {
	cache,
	createAsyncStore,
	useParams,
	type RouteSectionProps,
	type RouteDefinition,
} from '@solidjs/router';
import { createMemo, createSignal, For, Show, type Component } from 'solid-js';
import { AnimatedCard, Card, CardList, type CardComponentProps } from '@site/components/Card';
import type { CardInstance } from '@core/types';
import { clientOnly } from '@solidjs/start';

const UserCardList = clientOnly(() => import('@site/components/UserCardList'));

const fetchUserData = cache(async (username: string) => {
	'use server';
	const { getUserByUserName } = await import('@core/lib/user');
	const { getCardsByUserSortedByRarity } = await import('@core/lib/card');
	const { getUserByLogin } = await import('@core/lib/twitch');

	const user = getUserByUserName(username);
	const cards = getCardsByUserSortedByRarity({ username });
	const twitchData = getUserByLogin(username);

	return {
		user: await user,
		cards: await cards,
		twitchData: await twitchData,
	};
}, 'user');

const fetchUserCardsByRarity = cache(async (username: string, cursor?: string) => {
	const { getCardsByUserSortedByRarity } = await import('@core/lib/card');
	const cards = await getCardsByUserSortedByRarity({ username, cursor });
}, 'user-cards-rarity');

export const route: RouteDefinition = {
	preload({ params }) {
		fetchUserData(params.username);
	},
};

const UserPage: Component<RouteSectionProps> = props => {
	const params = useParams();
	const data = createAsyncStore(() => fetchUserData(params.username));
	const profileImage = () => data()?.twitchData?.profile_image_url;
	const user = () => data()?.user;
	const collections = createMemo(() => getCollectionsFromCards(data()?.cards.data ?? []));

	const IMG_SIZE = 100;

	return (
		<div class="max-w-main mx-auto">
			<div class="flex flex-wrap justify-items-center">
				<div class="w-fit">
					<section
						title="User identity"
						style={{
							'grid-template-rows': `repeat(2,${IMG_SIZE / 2}px)`,
						}}
						class="col-start-1 grid h-32 w-fit content-center gap-x-4">
						<img
							alt={`${params.username}'s profile image`}
							src={profileImage()}
							width={IMG_SIZE}
							height={IMG_SIZE}
							class="row-span-2 rounded-full"
						/>
						<h1 class="font-display col-start-2 self-end text-2xl italic">
							{params.username}
						</h1>

						<Show when={user()?.lookingFor}>
							{lookingFor => <UserLookingFor lookingFor={lookingFor()} />}
						</Show>
					</section>

					<Show when={user()?.pinnedCard}>
						{pinnedCard => <PinnedCard {...pinnedCard()} />}
					</Show>
				</div>
				<section title="collections" class="min-w-xl mx-auto mt-8 w-full max-w-4xl">
					<header class="flex justify-center">
						<h2 class="text-center text-3xl font-normal">Collections</h2>
					</header>
					<div class="grid grid-cols-2">
						<For each={collections()}>{Collection}</For>
					</div>
				</section>
			</div>
			<section title="all cards">
				<h2 class="py-8 text-center text-3xl font-normal">All Cards</h2>
				<UserCardList />
				<CardList>
					<For each={data()?.cards.data}>
						{card => (
							<li>
								<AnimatedCard>
									<Card {...card}></Card>
								</AnimatedCard>
							</li>
						)}
					</For>
				</CardList>
			</section>
		</div>
	);
};

const UserLookingFor: Component<{
	lookingFor: string;
}> = props => {
	const [isOpen, setIsOpen] = createSignal(false);
	return (
		<p
			data-open={isOpen()}
			class="relative col-start-2 grid max-h-32 max-w-80 gap-0 self-start overflow-hidden break-words pb-8 transition-all data-[open=true]:max-h-full">
			<span class="text-sm font-light italic">I'm looking for</span>
			<span class="block break-words text-lg font-normal leading-5">{props.lookingFor}</span>
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

const PinnedCard: Component<CardComponentProps> = props => {
	return (
		<div class="relative w-fit origin-top-left rotate-3 p-12">
			<Card {...props} scale={1.0} />
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
				class="fill-brand-500 dark:fill-brand-400"
				version="1.1"
				id="Capa_1"
				xmlns="http://www.w3.org/2000/svg"
				width="100%"
				height="100%"
				viewBox="0 0 340.001 340.001">
				<g>
					<g>
						<path
							class="fill-accent-50"
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

const Collection: Component<CollectionProps> = props => {
	const previewCards = (): [CardInstance, CardInstance, CardInstance] => [
		props.cards[0] || {},
		props.cards[1] || {},
		props.cards[2] || {},
	];

	const CARD_SCALE = 0.55;

	return (
		<div class="relative grid max-w-md gap-2 p-3 pb-12">
			<h3 class="py-3 text-center text-lg font-normal">{props.collectionName}</h3>
			<div class="relative mx-auto flex justify-center">
				<div class="relative w-24 translate-y-4 -rotate-6 justify-items-center">
					<AnimatedCard>
						<Card {...previewCards()[2]} scale={CARD_SCALE}></Card>
					</AnimatedCard>
				</div>
				<div class="w-24 rotate-2 justify-items-center">
					<AnimatedCard>
						<Card {...previewCards()[1]} scale={CARD_SCALE}></Card>
					</AnimatedCard>
				</div>
				<div class="w-24 translate-y-4 rotate-12 justify-items-center">
					<AnimatedCard>
						<Card {...previewCards()[0]} scale={CARD_SCALE}></Card>
					</AnimatedCard>
				</div>
			</div>
		</div>
	);
};

export default UserPage;

type CollectionProps = {
	collectionId: string;
	collectionName: string;
	cards: CardInstance[];
};

function getCollectionsFromCards(cards: CardInstance[]) {
	const collections = new Map<string, CollectionProps>();
	for (let card of cards) {
		if (!collections.has(card.seasonId)) {
			collections.set(card.seasonId, {
				collectionId: card.seasonId,
				cards: [card],
				collectionName: card.seasonName,
			});
			continue;
		} else {
			collections.get(card.seasonId)?.cards.push(card);
		}
	}

	return Array.from(collections.values());
}
