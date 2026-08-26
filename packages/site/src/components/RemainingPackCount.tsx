import { trpc } from '@site/client/api';
import { createResource, For } from 'solid-js';

export default function RemainingPackCount() {
	const [seasonRemainingDetails] = createResource(async () =>
		trpc.packs.seasonsRemainingCards.query().then(seasons => {
			return Object.values(seasons).filter(season => {
				if (season.possibleCards < 100) return false;
				if (season.seasonId.toLowerCase() === 'moments') return false;
				if (season.seasonName.toLowerCase() === 'moments') return false;
				if (season.remainingCards > 500 || season.remainingCards < 5) return false;
				else return true;
			});
		})
	);

	return (
		<ul>
			<For each={seasonRemainingDetails() ?? []}>
				{({ remainingCards, seasonName }) => (
					<li class="py-2 text-xl">
						<span class="text-brand-main">{Math.floor(remainingCards / 5)}</span> packs
						left in {seasonName}
					</li>
				)}
			</For>
		</ul>
	);
}
