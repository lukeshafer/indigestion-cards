import { For } from 'solid-js';

export default function PlaceholderCardList(props: { length?: number }) {
	return (
		<ul
			class="grid w-full justify-center justify-items-center gap-x-2 gap-y-14 px-3 [--card-scale:0.75] sm:[--card-scale:1] md:gap-x-6"
			style={{
				'grid-template-columns':
					'repeat(auto-fill, minmax(calc(var(--card-scale) * 18rem), 1fr))',
			}}>
			<For each={[...Array(props.length || 6).keys()]}>
				{() => (
					<li class="w-fit" style={ { 'font-size': `calc(1rem * var(--card-scale))` } }>
						<article class="card-wrapper card-aspect-ratio relative w-[18em] bg-cover text-left">
							<img
								src="/assets/cards/placeholder.png"
								alt=""
								class="absolute inset-0"
							/>
						</article>
					</li>
				)}
			</For>
		</ul>
	);
}
