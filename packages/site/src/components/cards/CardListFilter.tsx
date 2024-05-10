import { For, Show } from 'solid-js';
import { Fieldset, SubmitButton } from '../form/Form';
import type { CardType } from '@site/lib/client/utils';

export type SeasonFilterParams = {
	seasonId: string;
	seasonName: string;
};

type FilterParams = {
	seasons?: Array<SeasonFilterParams>;
	minterId?: boolean;
};

const PAGE_USER = 'page-user';
const OTHER_USER = 'other-user';
type MinterIdValue = typeof PAGE_USER | typeof OTHER_USER;

export type Filters = ReturnType<typeof createFilters>;

export const createFilters = (opts?: { seasonIds?: Array<string> }) => ({
	seasonIds: new Set<string>(opts?.seasonIds),
	minterId: new Set<MinterIdValue>(),
});

export const parseUniqueSeasons = (list: Array<Partial<SeasonFilterParams>>) =>
	Array.from(
		list
			.reduce<Map<string, SeasonFilterParams>>(
				(map, item) =>
					item.seasonId && item.seasonName
						? map.set(item.seasonId, {
								seasonId: item.seasonId,
								seasonName: item.seasonName,
							})
						: map,
				new Map()
			)
			.values()
	);

export default function CardListFilter(props: {
	params: FilterParams;
	setFilters: (filters: Filters) => void;
}) {
	return (
		<details class="w-fit min-w-32 max-w-72 self-end">
			<summary>Filter</summary>
			<form
				class="flex flex-wrap gap-2"
				onSubmit={e => e.preventDefault()}
				onInput={async e => {
					const formData = new FormData(e.currentTarget);
					syncFormDataWithUrlSearchParams(formData);
					props.setFilters({
						seasonIds: new Set(formData.getAll('seasonId') as Array<string>),
						minterId: new Set(formData.getAll('minterId') as Array<MinterIdValue>),
					});
				}}>
				<Show when={props.params.seasons}>
					{seasons => (
						<div class="w-fit">
							<Fieldset legend="Season">
								<For each={seasons()}>
									{({ seasonId, seasonName }) => (
										<label class="flex gap-2">
											<input
												type="checkbox"
												name="seasonId"
												value={seasonId}
												class="focus:border-brand-main focus:ring-brand-main inline-block w-auto 
                          rounded-none bg-white p-1 text-black focus:outline-none focus:ring-4"
											/>
											{seasonName}
										</label>
									)}
								</For>
							</Fieldset>
						</div>
					)}
				</Show>
				<Show when={props.params.minterId}>
					<div class="w-fit">
						<Fieldset legend="Origin">
							<label class="flex gap-2">
								<input
									type="checkbox"
									name="minterId"
									value={PAGE_USER}
									class="focus:border-brand-main focus:ring-brand-main inline-block w-auto 
                          rounded-none bg-white p-1 text-black focus:outline-none focus:ring-4"
								/>
								Minted
							</label>
							<label class="flex gap-2">
								<input
									type="checkbox"
									name="minterId"
									value={OTHER_USER}
									class="focus:border-brand-main focus:ring-brand-main inline-block w-auto 
                          rounded-none bg-white p-1 text-black focus:outline-none focus:ring-4"
								/>
								Traded
							</label>
						</Fieldset>
					</div>
				</Show>
				<div ref={e => e.remove()}>
					<SubmitButton>Save</SubmitButton>
				</div>
			</form>
		</details>
	);
}

function syncFormDataWithUrlSearchParams(formData: FormData) {
	const url = new URL(window.location.href);
	url.search = new URLSearchParams(formData as unknown as string).toString();
	window.history.replaceState({}, '', url.toString());
}

export function filterCards(cards: Array<CardType>, filters: Filters) {
	// console.log('filtering cards', { cards, filters });
	if (Object.values(filters).every(f => f.size === 0)) return cards;

	return cards.filter(card => {
		if (filters.seasonIds.size) {
			const hasValidSeason = checkCardHasValidSeason(card, filters.seasonIds);
			if (!hasValidSeason) return false;
		}

		if (filters.minterId.size) {
			const hasValidMinterId = checkCardHasValidMinterId(card, filters.minterId);
			if (!hasValidMinterId) return false;
		}

		return true;
	});
}

function checkCardHasValidSeason(card: CardType, seasons: Set<string>) {
	// console.log(card.seasonId, seasons);
	for (const seasonId of seasons) {
		if (card.seasonId === seasonId) return true;
		else continue;
	}
	return false;
}

function checkCardHasValidMinterId(card: CardType, minterId: Set<MinterIdValue>) {
	if (minterId.has(PAGE_USER) && card.minterId === card.userId) {
		return true;
	} else if (minterId.has(OTHER_USER) && card.minterId !== card.userId) {
		return true;
	} else {
		return false;
	}
}
