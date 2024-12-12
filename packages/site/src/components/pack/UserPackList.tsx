import type { PackCardsHidden } from '@core/types';
import { createEffect, createSignal, For, Show, type Component } from 'solid-js';
import { Pack } from './Pack';
import { transformPackTypeName } from '@site/lib/client/utils';
import { actions } from 'astro:actions';

export default function UserPackList(props: {
	packs: Array<PackCardsHidden>;
	isLoggedInUser: boolean;
}) {
	return (
		<ul
			class="grid w-full justify-center justify-items-center gap-x-2 gap-y-14 px-3 [--card-scale:0.75] sm:[--card-scale:1] md:gap-x-6"
			style={{
				'grid-template-columns':
					'repeat(auto-fill, minmax(calc(var(--card-scale) * 18rem), 1fr))',
			}}>
			<For each={props.packs}>
				{pack => <PackListItem pack={pack} canChangeLock={false} />}
			</For>
		</ul>
	);
}

const PackListItem: Component<{ pack: PackCardsHidden; canChangeLock: boolean }> = props => {
	const [isLocked, setIsLocked] = createSignal(props.pack.isLocked || false);

	return (
		<li class="relative w-fit">
			<Pack name={transformPackTypeName(props.pack.packTypeName)} />

			<Show when={isLocked()}>
				<div class="absolute inset-0 bg-black/50">
					<p class="my-14">
						<span class="block text-xl">Locked.</span>Cannot be opened.
					</p>
				</div>
			</Show>
			<Show when={props.canChangeLock}>
				<div class="absolute left-2 top-7">
					<LockButton
						isLocked={isLocked()}
						onClick={() => {
							let newValue = !isLocked();
							actions.packs
								.setIsLocked({
									packId: props.pack.packId,
									isLocked: newValue,
								})
								.then(val => {
									if (val.error) {
										setIsLocked(!newValue);
									}
								});
							setIsLocked(newValue);
						}}
					/>
				</div>
			</Show>
		</li>
	);
};

const LockButton: Component<{ isLocked: boolean; onClick: () => void }> = props => {
	const [mouseDown, setMouseDown] = createSignal(false);
	const [isHovering, setIsHovering] = createSignal(false);

	return (
		<div class="flex gap-3">
			<button
				class="grouplockbutton transition-transform ease-in-out"
				onMouseOver={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
				onClick={() => {
					props.onClick();
				}}
				onMouseDown={() => setMouseDown(true)}
				onMouseUp={() => setMouseDown(false)}
				style={{
					transform: mouseDown() ? 'rotate(10deg)' : 'rotate(0deg)',
				}}>
				<Lock isLocked={props.isLocked} />
			</button>
			<div
				data-hovering={isHovering()}
				class="opacity-0 transition-opacity data-[hovering=true]:opacity-100">
				{props.isLocked ? 'Click to unlock' : 'Click to lock'}
			</div>
		</div>
	);
};

const Lock: Component<{ isLocked: boolean }> = props => (
	<div
		class="group relative block h-6 w-7 cursor-pointer rounded border-2 border-[--lock-color] transition-all duration-100 ease-in-out data-[unlocked=true]:rotate-12 data-[unlocked=true]:hover:rotate-3"
		data-unlocked={!props.isLocked}
		style={{ '--lock-color': props.isLocked ? 'white' : 'white' }}>
		<div class="absolute bottom-full left-1/2 h-4 w-5 -translate-x-1/2 rounded-tl-full rounded-tr-full border-2 border-b-0 border-[--lock-color] transition-all duration-100 ease-in-out group-data-[unlocked=true]:bottom-[130%] group-data-[unlocked=true]:left-1/4 group-data-[unlocked=true]:-rotate-[30deg] group-data-[unlocked=true]:group-hover:bottom-[124%] group-data-[unlocked=true]:group-hover:left-1/3 group-data-[unlocked=false]:group-hover:h-5 group-data-[unlocked=true]:group-hover:-rotate-[20deg]" />
		<div class="absolute left-1/2 top-1/2 h-2 w-1 -translate-x-1/2 -translate-y-1/2 bg-[--lock-color] transition-all duration-100 ease-in-out"></div>
	</div>
);
