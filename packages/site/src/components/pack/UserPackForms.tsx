import { Form, Select, SubmitButton, DeleteButton } from '@/components/form/Form';
import { API } from '@/constants';
import { setTotalPackCount } from '@/lib/client/state';
import type { PackType } from '@lil-indigestion-cards/core/db/packTypes';
import type { User } from '@lil-indigestion-cards/core/db/users';
import { createResource } from 'solid-js';

export default function UserPackForms(props: { packTypes: PackType[]; user: User }) {
	const [packCount, { refetch }] = createResource(async () => {
		const auth_token = localStorage.getItem('auth_token');
		const response = await fetch(API.PACK_COUNT + '?userId=' + props.user.userId, {
			headers: { Authorization: auth_token ? `Bearer ${auth_token}` : '' },
		});
		if (!response.ok) return 0;
		const responseBody = await response.json();
		if (!responseBody.packCount || typeof responseBody.packCount !== 'number') return 0;
		return responseBody.packCount as number;
	});

	const refreshPackCounts = () => {
		setTotalPackCount((count) => count - 1);
		refetch();
	};

	return (
		<>
			<Form action={API.PACK} method="post" onsuccess={refreshPackCounts}>
				<input type="hidden" name="userId" value={props.user.userId} />
				<input type="hidden" name="username" value={props.user.username} />
				<div class="flex w-full items-center gap-2">
					<div class="w-fit">
						<Select
							name="packType"
							required
							options={[
								{ value: '', label: 'Choose Pack' },
								...props.packTypes.map((packType) => ({
									value: JSON.stringify(packType),
									label: packType.packTypeName,
								})),
							]}
						/>
					</div>

					<SubmitButton>Give Pack</SubmitButton>
				</div>
			</Form>
			<div class="flex w-full flex-wrap items-center gap-2">
				<p class="text-lg">Unopened Packs: {packCount() ?? props.user.packCount}</p>
				<Form action={API.PACK} method="delete" onsuccess={refreshPackCounts}>
					<input type="hidden" name="userId" value={props.user.userId} />
					<input type="hidden" name="username" value={props.user.username} />
					<DeleteButton>Revoke Pack</DeleteButton>
				</Form>
			</div>
		</>
	);
}
