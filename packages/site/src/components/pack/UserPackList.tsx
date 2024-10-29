import type { PackCardsHidden } from '@core/types';
import { For, type Component } from 'solid-js';
import { Heading } from '@site/components/text';

export default function UserPackList(props: { packs: Array<PackCardsHidden> }) {
	return (
		<section>
			<Heading>My Packs</Heading>
			<ul class="grid gap-2">
				<For each={props.packs}>{pack => <PackListItem pack={pack} />}</For>
			</ul>
			{/* TODO: add the give pack button */}
		</section>
	);
}

const PackListItem: Component<{ pack: PackCardsHidden }> = props => {
	const date = () => new Date(props.pack.createdAt!);

	return (
		<li class="">
			<p>{transformPackTypeName(props.pack.packTypeName)} pack</p>
			<p>Redeemed {date().toLocaleString()}</p>
			<pre>{JSON.stringify(props.pack, null, 2)}</pre>
		</li>
	);
};

function transformPackTypeName(name: string): string {
	const regex = /season(\d*)default/i;
	const result = name.match(regex);
	const number = result?.[1];

	if (number) {
		return `Season ${number}`;
	}

	return name;
}
