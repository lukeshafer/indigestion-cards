import { type Component } from 'solid-js';
import type { Season } from '@core/types';
import type { FullArtStatistics, RarityStatistics, SeasonStatistics } from '@core/lib/stats';
import { Heading } from '@site/components/text';

export const StatisticsPage: Component<{ stats: SeasonStatistics; season: Season }> = props => {
	return (
		<main class="relative">
			<Heading>{props.season.seasonName}</Heading>

			<p>
				<b>Cards opened:</b> {props.stats.cardsOpened}
			</p>
			<p>
				<b>Cards remaining:</b> {intRange(props.stats.cardsRemaining)}
			</p>
			<p>
				<b>Total cards possible:</b> {intRange(props.stats.cardsPossible)}
			</p>
			<p>
				<b>Percentage opened:</b> {percentRange(props.stats.percentageOpened)}
			</p>
			<br />
			<p>
				<b>Packs opened:</b> {props.stats.packsOpened}
			</p>
			<p>
				<b>Packs unopened:</b> {props.stats.packsUnopened}
			</p>
			<p>
				<b>Packs remaining:</b> {intRange(props.stats.packsRemaining)}
			</p>
			<br />
			<section class="ml-4 grid gap-4">
				<Heading heading="h3">Rarity Stats</Heading>
				<FullArtStats stats={props.stats.rarities.fullArt} />
				<RarityStats name="Pink" stats={props.stats.rarities.pink} />
				<RarityStats name="Rainbow" stats={props.stats.rarities.rainbow} />
				<RarityStats name="White" stats={props.stats.rarities.white} />
				<RarityStats name="Gold" stats={props.stats.rarities.gold} />
				<RarityStats name="Silver" stats={props.stats.rarities.silver} />
				<RarityStats name="Bronze" stats={props.stats.rarities.bronze} />
			</section>
		</main>
	);
};

const FullArtStats: Component<{
	stats: FullArtStatistics;
}> = props => {
	return (
		<div>
			<h4 class="text-lg font-bold">Full Art</h4>
			<p>
				<b>Cards opened:</b> {props.stats.cardsOpened}
			</p>
			<p>
				<i>
					{props.stats.allOpened
						? 'All full arts have been found this season.'
						: 'There are still full arts to be found.'}
				</i>
			</p>
		</div>
	);
};

const RarityStats: Component<{
	name: string;
	stats: RarityStatistics;
}> = props => {
	return (
		<div>
			<h4 class="text-lg font-bold">{props.name}</h4>
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
	if (range.min === range.max) return (100 * range.min).toFixed(2) + '%';

	return `${(100 * range.min).toFixed(2)}% - ${(100 * range.max).toFixed(2)}%`;
}
