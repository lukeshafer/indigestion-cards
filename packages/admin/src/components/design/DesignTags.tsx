import type * as DB from '@core/types';
import * as Solid from 'solid-js';
import * as SolidStore from 'solid-js/store';
import * as Form from '@admin/components/form/Form';
import { actions } from 'astro:actions';
import { setAlerts } from '@admin/lib/client/state';

export const DesignTags: Solid.Component<{
	design: DB.CardDesign;
}> = props => {
	// eslint-disable-next-line solid/reactivity
	const [tags, setTags] = SolidStore.createStore<Array<string>>(props.design.tags ?? []);

	return (
		<div>
			<ul class="flex w-full max-w-lg flex-wrap justify-center gap-2 py-2">
				<Solid.For each={tags}>
					{(tag, index) => (
						<li class="flex w-fit items-center gap-3 rounded-full bg-gray-200 px-4 py-2 dark:bg-gray-800">
							<span>{tag}</span>
							<button
								class="text-xl text-red-500"
								onClick={() => {
									let i = index();
									setTags(SolidStore.produce(t => t.splice(i, 1)));

									actions.designs
										.removeTag({
											designId: props.design.designId,
											tag,
										})
										.catch(() =>
											setTags(t => [...t.slice(0, i), tag, ...t.slice(i)])
										);
								}}>
								×
							</button>
						</li>
					)}
				</Solid.For>
			</ul>

			<form
				class="grid place-items-center gap-y-2"
				onSubmit={async e => {
					e.preventDefault();
					const text: string = e.currentTarget.newTagName.value;
					if (text) {
						setTags(SolidStore.produce(l => l.push(text)));
						e.currentTarget.newTagName.value = '';
						await actions.designs.addTag({
							designId: props.design.designId,
							tags: [text],
						});
					}
				}}>
				<Form.TextInput label="Tag" inputOnly name="newTagName" />
				<Form.SubmitButton>Add Tag</Form.SubmitButton>
			</form>

			<form
				class="grid place-items-center gap-y-2"
				onSubmit={async e => {
					e.preventDefault();
					await actions.designs
						.setGame({
							designId: props.design.designId,
							game: e.currentTarget.game.value,
						})
						.then(() => {
							setAlerts(alerts => [
								{ type: 'success', message: 'Updated game.' },
								...alerts,
							]);
						});
				}}>
				<Form.TextInput value={props.design.game} label="Game" name="game" />
				<Form.SubmitButton>Update game</Form.SubmitButton>
			</form>
		</div>
	);
};
