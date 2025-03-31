import { For, Show, type Component } from 'solid-js';
import type { FullArtStatistics, RarityStatistics, SeasonStatistics } from '@core/lib/stats';
import { Heading, PageHeader, PageTitle } from '@site/components/text';

export const StatisticsPage: Component<{ stats: SeasonStatistics }> = props => {
	const hasRanges = () => props.stats.cardsRemaining.min !== props.stats.cardsRemaining.max;

	return (
		<>
			<PageHeader>
				<PageTitle>
					{props.stats.season.seasonName}
					<span class="block text-center text-2xl">Statistics</span>
				</PageTitle>
			</PageHeader>
			<main class="relative">
				<section class="grid gap-8">
					<div class="mx-auto flex w-fit grid-cols-3 place-items-center gap-x-8 gap-y-6">
						<div class="w-fit rounded p-1 text-center">
							<p class="px-2 text-3xl">
								{percentRange(props.stats.percentageOpened)}
							</p>
							<p class="text-sm text-gray-800 dark:text-gray-200">complete</p>
						</div>
						<div class="w-fit rounded p-1 text-center">
							<p class="px-2 text-3xl">{props.stats.cardsOpened.toFixed()}</p>
							<div class="mx-auto h-px w-1/2 border-t pb-1">
								<p class="sr-only">out of</p>
							</div>
							<p class="px-2 text-2xl">
								<UncertainRange range={props.stats.cardsPossible} />
							</p>
							<p class="text-sm text-gray-800 dark:text-gray-200">cards opened</p>
						</div>
						<div class="w-fit rounded p-1 text-center">
							<p class="px-2 text-3xl">
								{Math.floor(props.stats.packsOpened).toFixed()}
							</p>
							<div class="mx-auto h-px w-1/2 border-t pb-1">
								<p class="sr-only">out of</p>
							</div>
							<p class="px-2 text-2xl">
								<UncertainRange range={props.stats.packsPossible} />
							</p>
							<p class="text-sm text-gray-800 dark:text-gray-200">packs opened</p>
						</div>
						<div class="w-fit rounded p-1 text-center">
							<p class="px-2 text-2xl">
								{Math.ceil(props.stats.packsUnopened).toFixed()}
							</p>
							<p class="text-xs text-gray-800 dark:text-gray-200">packs unopened</p>
						</div>
					</div>
				</section>
				<Show when={hasRanges()}>
					<details class="mx-auto my-4 w-full max-w-80 rounded bg-gray-100 p-1 px-2 text-sm dark:bg-gray-900">
						<summary class="cursor-pointer py-2 text-center text-gray-800 dark:text-gray-300">
							Why are some of the values not exact?
						</summary>
						<p class="my-2">
							To keep unrevealed full art cards a secret, any statistics relating to
							unopened cards are left uncertain.
						</p>
						<p>
							If you see a number ending in '<code>+</code>', the number shown is
							assuming there are <em>no more full arts to be found</em>, so as not to
							reveal how many full arts are left.
						</p>
						<p class="my-2">
							Once all full art cards have been opened this season, this page will
							update with the final numbers.
						</p>
					</details>
				</Show>

				<section class="mx-auto mt-8 grid w-fit grid-cols-3 place-items-center gap-4">
					<header class="col-span-full w-full text-center">
						<Heading heading="h2">Rarities</Heading>
					</header>
					<Show
						when={
							props.stats.fullArt.cardsOpened > 0 ||
							props.stats.fullArt.allOpened == false
						}>
						<FullArtStats stats={props.stats.fullArt} />
					</Show>
					<For
						each={props.stats.rarities
							.slice()
							.sort((a, b) => a.cardsPossible - b.cardsPossible)}>
						{rarity => <RarityStats stats={rarity} />}
					</For>
				</section>
			</main>
		</>
	);
};

const FullArtStats: Component<{
	stats: FullArtStatistics;
}> = props => {
	return (
		<div class="bg-brand-light col-span-full w-fit rounded p-4 text-center text-gray-900">
			<h3 class="text-lg font-bold">Full Art</h3>
			<p class="text-xl">
				<span class="block font-bold">{props.stats.cardsOpened}</span>
				<span class="block text-sm leading-none">
					card{props.stats.cardsOpened !== 1 ? 's' : ''} opened
				</span>
			</p>
			<p class="text-brand-950 mt-2">
				{props.stats.allOpened
					? 'All full arts have been opened.'
					: 'Not all full arts have been opened.'}
			</p>
		</div>
	);
};

const RarityStats: Component<{
	stats: RarityStatistics;
}> = props => {
	return (
		<div
			style={{ background: props.stats.background }}
			class="w-fit rounded p-4 text-center text-gray-900">
			<h3 class="text-lg font-bold">
				{props.stats.rarityName[0].toUpperCase() + props.stats.rarityName.slice(1)}
			</h3>
			<p class="text-xl">
				<span class="block font-bold">{props.stats.cardsOpened}</span>
				<span class="mx-auto block h-px w-10 border-t border-current">
					<span class="sr-only">out of</span>
				</span>
				<span class="block text-lg">{props.stats.cardsPossible}</span>
				<span class="block text-sm leading-none">
					card{props.stats.cardsOpened !== 1 ? 's' : ''} opened
				</span>
			</p>
			<p class="mt-4">{(props.stats.percentageOpened * 100).toFixed(2)}% complete</p>
		</div>
	);
};

type NumberRange = {
	min: number;
	max: number;
};

const UncertainRange: Component<{ range: NumberRange }> = props => (
	<span class="relative">
		{props.range.min.toFixed()}
		<Show when={props.range.min < props.range.max}>
			<span class="absolute left-full">+</span>
		</Show>
	</span>
);

function percentRange(range: NumberRange): string {
	let minStr = (100 * range.min).toFixed(1);
	let maxStr = (100 * range.max).toFixed(1);
	if (minStr === maxStr) return minStr + '%';

	if (Math.abs(range.max - range.min) < 0.002) return `~${minStr}%`;

	return `${minStr}-${maxStr}%`;
}
