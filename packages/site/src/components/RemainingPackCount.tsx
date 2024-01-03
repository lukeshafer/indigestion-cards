import { get } from '@/lib/client/data';
import { For, createResource } from 'solid-js';

export default function RemainingPackCount() {
	const [packData] = createResource(async () => {
		const data = await get('packs-remaining');
		return data.filter(data => {
			if (data.possibleCards < 100) return false;
			if (data.seasonId.toLowerCase() === 'moments') return false;
			if (data.seasonName.toLowerCase() === 'moments') return false;
			if (data.remainingCards > 250 || data.remainingCards < 5) return false;

			return true;
		});
	});

	return (
		<div style={{ 'view-transition-name': 'remaining-pack-count' }}>
			<For each={packData()}>
				{season => (
					<p class="py-2 text-xl">
						<span class="count text-brand-main">
							{Math.floor(season.remainingCards / 5)}
						</span>{' '}
						packs left in {season.seasonName}
					</p>
				)}
			</For>
		</div>
	);
}
