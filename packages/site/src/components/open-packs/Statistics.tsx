import {
	Show,
	Suspense,
	createEffect,
	createResource,
	createSignal,
	onMount,
	useContext,
} from 'solid-js';
import { OpenPacksContext } from './OpenPacksContext';
import { API, ASSETS, SHIT_PACK_RARITY_ID, resolveLocalPath } from '@site/constants';
import { Checkbox } from '../Form';

export function Statistics() {
	const ctx = useContext(OpenPacksContext);

	const state = () => ({
		cardsOpened: ctx.activePack?.cardDetails
			.filter(card => card.opened === true)
			.sort((a, b) => b.totalOfType - a.totalOfType),
		cardsOpenedCount: ctx.activePack?.cardDetails.filter(card => card.opened).length || 0,
		totalCardCount: ctx.activePack?.cardDetails.length,
		packTypeId: ctx.activePack?.packTypeId,
		packId: ctx.activePack?.packId,
		get firstCardOpened() {
			return state().cardsOpened?.at(0);
		},
	});

	const [isShitpackVisible, setIsShitpackVisible] = createSignal(false);

	onMount(() => {
		setIsShitpackVisible(localStorage.getItem('isShitpackVisible') === 'true');
	});

	createEffect(() => {
		localStorage.setItem('isShitpackVisible', isShitpackVisible() ? 'true' : 'false');
	});

	const [resource] = createResource(state, async state => {
		if (!state.totalCardCount || !state.packId) {
			return { shitPackOdds: 0 };
		}

		if (state.cardsOpened?.some(card => card.rarityId !== state.cardsOpened?.[0]?.rarityId))
			// can't be a shit pack if any opened cards are not bronze
			return { shitPackOdds: 0 };

		if (state.cardsOpenedCount === state.totalCardCount)
			// returning a timeout to make sure the card is flipped before we see this number (for suspense)
			return new Promise<{ shitPackOdds: number }>(res =>
				setTimeout(() => res({ shitPackOdds: 1 }), 500)
			);

		const searchParams = new URLSearchParams({
			remainingCardCount: (state.totalCardCount - state.cardsOpenedCount).toString(),
			packTypeId: state.packTypeId || '0',
		});

		if (state.firstCardOpened) {
			searchParams.set('rarityId', state.firstCardOpened.rarityId);
		}

		const body = await fetch(resolveLocalPath(API.STATS + `?${searchParams.toString()}`)).then(
			res => res.text()
		);

		const json = JSON.parse(body);

		return {
			shitPackOdds: Number(json.shitPackOdds) || 0,
		};
	});

	const shitPackOdds = () => resource()?.shitPackOdds || 0;
	const formattedShitPack = () => {
		if (shitPackOdds() === 0) {
			return '0%';
		} else if (shitPackOdds() < 0.0001) {
			const odds = Math.floor(shitPackOdds() * 1000000) / 10000;
			if (odds >= 0.0001) {
				return `${odds}%`;
			} else {
				return '< 0.0001%';
			}
		}
		return `${Math.floor(shitPackOdds() * 10000) / 100}%`;
	};
	const hasOneMoreCard = (chance: number) =>
		chance > 0 && chance < 1 && (state().totalCardCount || 0) - 1 === state().cardsOpenedCount;

	return (
		<Show when={state().totalCardCount}>
			<div class="group m-6 flex h-10 items-center gap-2">
				<p
					class="text-xl transition-opacity"
					classList={{
						'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100':
							!isShitpackVisible(),
					}}>
					<Show
						when={
							!state().firstCardOpened?.rarityId.startsWith(SHIT_PACK_RARITY_ID) &&
							state().firstCardOpened
						}
						fallback="Shit pack: ">
						{card => <>{card().rarityName.toUpperCase()} SHIT PACK: </>}
					</Show>
					<Suspense fallback={<span class="text-gray-500">Calculating...</span>}>
						<div class="inline-flex items-center gap-2">
							{formattedShitPack()}{' '}
							{hasOneMoreCard(shitPackOdds()) ? (
								<img src={ASSETS.EMOTES.LILINDPB} width="30" />
							) : shitPackOdds() === 1 ? (
								<img src={ASSETS.EMOTES.LILINDBLIF} width="30" />
							) : shitPackOdds() === 0 ? (
								<img src={ASSETS.EMOTES.LILINDDISBLIF} width="30" />
							) : null}
						</div>
					</Suspense>
				</p>
				<div class="cursor-pointer opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
					<Checkbox
						value={isShitpackVisible()}
						setValue={setIsShitpackVisible}
						label=""
						name="shit-pack-chances"
					/>
				</div>
			</div>
		</Show>
	);
}
