import type { Component } from 'solid-js';

export const Pack: Component<{
	name: string;
	scale?: number;
}> = props => (
	<div
		class="border-brand-main/50 bg-brand-main/25 card-aspect-ratio relative flex flex-col justify-center border px-[2.5em] py-[1.5em] text-center"
		style={{
			width: '18em',
			'font-size': `calc(${props.scale ?? 1}rem * var(--card-scale))`,
		}}>
		<p class="font-display absolute bottom-0 right-0 whitespace-break-spaces p-[0.5em] font-bold lowercase italic leading-[0.7em]">
			Indigestion
		</p>
		<p class="self-center whitespace-break-spaces text-center">
			<span class="text-[2em] font-bold">{props.name}</span>
			{<span class="block leading-[0.5em]">pack</span>}
		</p>
	</div>
);
