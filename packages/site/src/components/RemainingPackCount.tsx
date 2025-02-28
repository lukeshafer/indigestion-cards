import { trpc } from '@site/lib/client/trpc';
import { createResource, For } from 'solid-js';

export default function RemainingPackCount() {
	const [packsRemaining] = createResource(async () =>
    trpc.packs.packsRemaining.query().then(packs => 
			packs.filter(pack => {
				if (pack.possibleCards < 100) return false;
				if (pack.seasonId.toLowerCase() === 'moments') return false;
				if (pack.seasonName.toLowerCase() === 'moments') return false;
				if (pack.remainingCards > 250 || pack.remainingCards < 5) return false;

				return true;
			})
    )
	);

	return (
		<ul>
			<For each={packsRemaining() ?? []}>
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
