import { routes, NO_CARDS_OPENED_ID, FULL_ART_ID, LEGACY_CARD_ID } from '@/constants';
import Card from '@/components/cards/Card';
import { For, Show, createEffect, createSignal } from 'solid-js';
import { Fieldset, Select, SubmitButton, TextInput } from '../form/Form';
import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import type { CardDesign } from '@lil-indigestion-cards/core/db/cardDesigns';
import { useViewTransition } from '@/lib/client/utils';
import type { Session } from '@/env';
import type { RarityRankingRecord } from '@lil-indigestion-cards/core/lib/site-config';
import Fuse from 'fuse.js';

type CardType = Parameters<typeof Card>[0] & Partial<CardInstance> & Partial<CardDesign>;

export const sortTypes = [
  { value: 'rarest', label: 'Most to Least Rare' },
  { value: 'common', label: 'Least to Most Rare' },
  { value: 'card-name-asc', label: 'Card Name (A-Z)' },
  { value: 'card-name-desc', label: 'Card Name (Z-A)' },
  { value: 'open-date-desc', label: 'Date Opened (Newest to Oldest)' },
  { value: 'open-date-asc', label: 'Date Opened (Oldest to Newest)' },
  { value: 'owner-asc', label: 'Owner (A-Z)' },
  { value: 'owner-desc', label: 'Owner (Z-A)' },
] as const;

export type SortType = (typeof sortTypes)[number]['value'];

export default function CardList(props: {
  cards: CardType[];
  showUsernames?: boolean;
  noSort?: boolean;
  sortOnlyBy?: SortType[];
  sessionType?: Session['type'];
  isUserPage?: boolean;
  rarityRanking?: RarityRankingRecord;
  filters?: Array<[string, string]>;
}) {
  const allowedSortTypes = () =>
    props.sortOnlyBy?.length
      ? sortTypes.filter(type => props.sortOnlyBy?.includes(type.value))
      : sortTypes.slice();
  // eslint-disable-next-line solid/reactivity
  const [sort, setSort] = createSignal<string>(allowedSortTypes()[0].value);
  const [searchText, setSearchText] = createSignal('');
  const [filters, setFilters] = createSignal<[string, FormDataEntryValue][]>(props.filters ?? []);

  const seasons = () => [
    ...props.cards.reduce<Map<string, string>>(
      (map, card) =>
        card.seasonId && card.seasonName ? map.set(card.seasonId, card.seasonName) : map,
      new Map()
    ),
  ];

  const cards = () => {
    const filtered =
      filters().length === 0
        ? props.cards
        : props.cards.filter(c =>
          filters().some(([key, value]) => c[key as keyof typeof c] === value)
        );

    const sorted = sortCards({
      cards: filtered,
      sort: sort(),
      rarityRanking: props.rarityRanking,
    });

    const searcher = getCardSearcher(sorted);

    const searched = searchText() ? searcher(searchText()) : sorted;
    return searched;
  };

  createEffect(() => { });

  return (
    <div class="flex flex-col gap-3 ">
      <div class="flex px-4">
        {seasons().length > 1 ? (
          <details class="w-full max-w-72 self-end ">
            <summary>Filter</summary>
            <form
              class="grid"
              onSubmit={e => e.preventDefault()}
              onInput={async e => {
                const formData = new FormData(e.currentTarget);
                syncFormDataWithUrlSearchParams(formData);
                setFilters(Array.from(formData.entries()));
              }}>
              <Fieldset legend="Season">
                {seasons().map(([seasonId, seasonName]) => (
                  <label class="flex gap-2">
                    <input
                      type="checkbox"
                      name="seasonId"
                      checked={props.filters?.some(
                        ([key, value]) =>
                          key === 'seasonId' && value === seasonId
                      )}
                      value={seasonId}
                      class="focus:border-brand-main focus:ring-brand-main inline-block w-auto 
                      rounded-none bg-white p-1 text-black focus:outline-none focus:ring-4"
                    />
                    {seasonName}
                  </label>
                ))}
              </Fieldset>
              <div ref={e => e.remove()}>
                <SubmitButton>Save</SubmitButton>
              </div>
            </form>
          </details>
        ) : null}
        <div class="ml-auto flex gap-4">
          <TextInput
            class="h-8 self-end"
            name="search"
            label="Search cards"
            type="text"
            setValue={setSearchText}
          />
          {props.noSort ? null : (
            <Select
              name="sort"
              class="h-8 self-end p-1"
              label="Sort by"
              setValue={val => useViewTransition(() => setSort(val))}
              options={allowedSortTypes()}
            />
          )}
        </div>
      </div>
      <ul
        class="grid w-full justify-center justify-items-center gap-x-2 gap-y-14 px-3 [--card-scale:0.75] sm:[--card-scale:1] md:gap-x-6"
        style={{
          'grid-template-columns':
            'repeat(auto-fill, minmax(calc(var(--card-scale) * 18rem), 1fr))',
        }}>
        <Show when={cards().length > 0} fallback={<p>No cards found</p>}>
          <For each={cards()}>
            {(card, index) => (
              <li class="w-fit">
                {card.bestRarityFound?.rarityId === NO_CARDS_OPENED_ID ? (
                  <Card {...card} lazy={index() > 5} scale="var(--card-scale)" />
                ) : (
                  <>
                    <a
                      href={
                        props.isUserPage && card.username
                          ? `${routes.USERS}/${card.username}/${card.instanceId ?? ''
                          }`
                          : `${routes.INSTANCES}/${card.designId}/${card.instanceId ?? ''
                          }`
                      }>
                      <Card
                        {...card}
                        lazy={index() > 5}
                        scale="var(--card-scale)"
                      />
                    </a>
                    <Show when={props.showUsernames}>
                      <p class="mt-2">
                        Owner:{' '}
                        <a
                          href={`${routes.USERS}/${card.username}`}
                          class="inline font-bold hover:underline">
                          {card.username}
                        </a>
                      </p>
                    </Show>
                  </>
                )}
              </li>
            )}
          </For>
        </Show>
      </ul>
    </div>
  );
}

export function sortCards<T extends CardType>(args: {
  cards: T[];
  // eslint-disable-next-line @typescript-eslint/ban-types
  sort: SortType | (string & {});
  rarityRanking?: RarityRankingRecord;
}) {
  const { cards, sort } = args;

  switch (sort) {
    case 'card-name-asc':
      return cards.sort(
        (a, b) =>
          a.cardName.localeCompare(b.cardName) ||
          a.totalOfType - b.totalOfType ||
          +a.cardNumber - +b.cardNumber
      );
    case 'card-name-desc':
      return cards.sort(
        (a, b) =>
          b.cardName.localeCompare(a.cardName) ||
          a.totalOfType - b.totalOfType ||
          +a.cardNumber - +b.cardNumber
      );
    case 'rarest':
      return cards.sort((a, b) => rarestCardSort(a, b, args.rarityRanking));
    case 'common':
      return cards.sort((a, b) => rarestCardSort(a, b, args.rarityRanking)).reverse();
    case 'open-date-desc':
      return cards.sort((a, b) =>
        !(a.openedAt && b.openedAt)
          ? 0
          : new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime() ||
          a.cardName.localeCompare(b.cardName) ||
          +a.cardNumber - +b.cardNumber
      );
    case 'open-date-asc':
      return cards.sort((a, b) =>
        !(a.openedAt && b.openedAt)
          ? 0
          : new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime() ||
          a.cardName.localeCompare(b.cardName) ||
          +a.cardNumber - +b.cardNumber
      );
    case 'owner-asc':
      return cards.sort((a, b) =>
        !(a.username && b.username)
          ? 0
          : a.username.localeCompare(b.username) ||
          a.cardName.localeCompare(b.cardName) ||
          +a.cardNumber - +b.cardNumber
      );
    case 'owner-desc':
      return cards.sort((a, b) =>
        !(a.username && b.username)
          ? 0
          : b.username.localeCompare(a.username) ||
          a.cardName.localeCompare(b.cardName) ||
          +a.cardNumber - +b.cardNumber
      );
    default:
      return cards;
  }
}

function rarestCardSort(a: CardType, b: CardType, rarityRanking?: RarityRankingRecord) {
  if (rarityRanking) {
    const aRank = rarityRanking[a.rarityId]?.ranking ?? Infinity;
    const bRank = rarityRanking[b.rarityId]?.ranking ?? Infinity;
    return aRank - bRank;
  }

  if (a.totalOfType !== b.totalOfType) {
    return a.totalOfType - b.totalOfType;
  }

  if (a.rarityId === LEGACY_CARD_ID && b.rarityId !== LEGACY_CARD_ID) {
    return -1;
  } else if (b.rarityId === LEGACY_CARD_ID && a.rarityId !== LEGACY_CARD_ID) {
    return 1;
  }
  if (a.rarityId === FULL_ART_ID && b.rarityId !== FULL_ART_ID) {
    return -1;
  } else if (b.rarityId === FULL_ART_ID && a.rarityId !== FULL_ART_ID) {
    return 1;
  }

  return a.cardName.localeCompare(b.cardName) || +a.cardNumber - +b.cardNumber;
}

export function getCardSearcher(cards: CardType[]) {
  const fuse = new Fuse(cards, {
    keys: [
      {
        name: 'cardName',
        weight: 5,
      },
      {
        name: 'rarityName',
        weight: 5,
      },
      {
        name: 'seasonName',
        weight: 2,
      },
      {
        name: 'cardNumber',
        weight: 2,
      },
      {
        name: 'username',
        weight: 1,
      },
      {
        name: 'stamps',
        weight: 1,
      },
    ],
  });

  return (searchTerm: string) => fuse.search(searchTerm).map(result => result.item);
}

function syncFormDataWithUrlSearchParams(formData: FormData) {
  const url = new URL(window.location.href);
  url.search = new URLSearchParams(formData as unknown as string).toString();
  window.history.replaceState({}, '', url.toString());
}
