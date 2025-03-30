import { Show, type Component, type ParentComponent } from 'solid-js';
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
					<MainStatisticSection footer={`Total: ${intRange(props.stats.cardsPossible)}`}>
						<MainStatistic title="cards opened">
							{props.stats.cardsOpened}
						</MainStatistic>
						<MainStatistic title="complete">
							{percentRange(props.stats.percentageOpened)}
						</MainStatistic>
						<MainStatistic title="cards remaining">
							{intRange(props.stats.cardsRemaining)}
						</MainStatistic>
					</MainStatisticSection>

					<MainStatisticSection footer={`Total: ${intRange(props.stats.packsPossible)}`}>
						<MainStatistic title="packs opened">
							{props.stats.packsOpened}
						</MainStatistic>
						<MainStatistic title="packs unopened">
							{props.stats.packsUnopened}
						</MainStatistic>
						<MainStatistic title="packs remaining">
							{intRange(props.stats.packsRemaining)}
						</MainStatistic>
					</MainStatisticSection>
				</section>
				<Show when={hasRanges()}>
					<details class="mx-auto my-4 w-full max-w-80 rounded bg-gray-100 p-1 px-2 text-sm dark:bg-gray-900">
						<summary class="cursor-pointer py-2 text-center text-gray-800 dark:text-gray-300">
							Why are some of the statistics ranges?
						</summary>
						<p class="my-2">
							To keep unrevealed full art cards a secret, any statistics relating to
							unopened cards provide a range of two values:
						</p>
						<ul class="ml-2">
							<li class="before:content-['-_']">
								One as if there are <u>no full arts left</u>
							</li>
							<li class="before:content-['-_']">
								One as if <u>every card has a full art</u>
							</li>
						</ul>
						<p class="my-2">
							Once all full art cards have been opened this season, this page will
							update with the final numbers.
						</p>
					</details>
				</Show>

				<section class="mx-auto grid w-fit grid-cols-3 place-items-center gap-4 mt-8">
					<header class="col-span-full w-full text-center">
						<Heading heading="h2">Rarities</Heading>
					</header>
					<FullArtStats stats={props.stats.rarities.fullArt} />
					<RarityStats name="Pink" stats={props.stats.rarities.pink} />
					<RarityStats name="Rainbow" stats={props.stats.rarities.rainbow} />
					<RarityStats name="White" stats={props.stats.rarities.white} />
					<RarityStats name="Gold" stats={props.stats.rarities.gold} />
					<RarityStats name="Silver" stats={props.stats.rarities.silver} />
					<RarityStats name="Bronze" stats={props.stats.rarities.bronze} />
				</section>
			</main>
		</>
	);
};

const MainStatistic: ParentComponent<{ title: string }> = props => {
	return (
		<div class="bg-brand-light dark:bg-brand-dark w-fit rounded p-1 text-center">
			<p class="px-2 text-2xl">{props.children}</p>
			<h2 class="text-xs text-gray-800 dark:text-gray-200">{props.title}</h2>
		</div>
	);
};

const MainStatisticSection: ParentComponent<{ footer?: string }> = props => (
	<div>
		<div class="mx-auto flex w-fit grid-cols-3 place-items-center gap-x-8 gap-y-6">
			{props.children}
		</div>
		<Show when={props.footer}>
			<p class="py-2 text-center text-xs opacity-80">{props.footer}</p>
		</Show>
	</div>
);

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
	name: string;
	stats: RarityStatistics;
}> = props => {
	return (
		<div style={{ background: props.stats.background }} class="w-fit rounded p-4 text-gray-900">
			<h3 class="text-lg font-bold">{props.name}</h3>
			<p>
				<b>Cards opened:</b> {props.stats.cardsOpened}
			</p>
			<p>
				<b>Cards remaining:</b> {props.stats.cardsRemaining}
			</p>
			<p>
				<b>Total cards possible:</b> {props.stats.cardsPossible}
			</p>
			<p>
				<b>Percentage opened:</b> {(props.stats.percentageOpened * 100).toFixed(2)}%
			</p>
		</div>
	);
};

type NumberRange = {
	min: number;
	max: number;
};

function intRange(range: NumberRange): string {
	if (range.min === range.max) return range.min.toString();

	return `${range.min} - ${range.max}`;
}

function percentRange(range: NumberRange): string {
	let minStr = (100 * range.min).toFixed(1);
	let maxStr = (100 * range.max).toFixed(1);
	if (minStr === maxStr) return minStr + '%';

	if (Math.abs(range.max - range.min) < 0.002)
		return `~${(50 * (range.min + range.max)).toFixed(1)}%`;

	return `${minStr}-${maxStr}%`;
}
