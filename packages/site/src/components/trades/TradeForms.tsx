import { createSignal, Match, Show, Switch, type Component } from 'solid-js';
import { DeleteButton, Loading, SubmitButton } from '../Form';
import { trpc } from '@site/client/api';
import { TRPCError } from '@trpc/server';
import { pushAlert } from '@site/client/state';

export const TradeForms: Component<{
	tradeId: string;
	isSender: boolean;
	isReceiver: boolean;
}> = props => {
	const [isLoading, setIsLoading] = createSignal(false);

	return (
		<div class="relative col-span-full justify-self-center">
			<Show when={isLoading()}>
				<Loading loadingText={'Updating trade...'} />
			</Show>
			<Switch>
				<Match when={props.isSender}>
					<form
						onSubmit={e => {
							e.preventDefault();
							let tradeId = props.tradeId;
							setIsLoading(true);
							trpc.trades.update
								.mutate({ tradeId, status: 'canceled' })
								.then(() =>
									location.assign(`/trades/${tradeId}?alert=Trade canceled`)
								)
								.catch((e: TRPCError) =>
									pushAlert({ message: e.message, type: 'error' })
								)
								.finally(() => setIsLoading(false));
						}}>
						<DeleteButton confirm="Are you sure you want to cancel this trade?">Cancel offer</DeleteButton>
					</form>
				</Match>
				<Match when={props.isReceiver}>
					<div class="flex flex-wrap justify-center justify-items-center gap-2">
						<form
							class="w-fit"
							onSubmit={e => {
								e.preventDefault();
								let tradeId = props.tradeId;
								setIsLoading(true);
								trpc.trades.update
									.mutate({ tradeId, status: 'accepted' })
									.then(() =>
										location.assign(`/trades/${tradeId}?alert=Trade accepted.`)
									)
									.catch((e: TRPCError) =>
										pushAlert({ message: e.message, type: 'error' })
									)
									.finally(() => setIsLoading(false));
							}}>
							<SubmitButton confirm="Are you sure you want to accept this trade? Once accepted, the trade is final and cannot be reversed.">
								<div class="min-w-[8rem]">Accept offer</div>
							</SubmitButton>
						</form>
						<form
							class="w-fit"
							onSubmit={e => {
								e.preventDefault();
								let tradeId = props.tradeId;
								setIsLoading(true);
								trpc.trades.update
									.mutate({ tradeId, status: 'rejected' })
									.then(() =>
										location.assign(`/trades/${tradeId}?alert=Trade declined.`)
									)
									.catch((e: TRPCError) =>
										pushAlert({ message: e.message, type: 'error' })
									)
									.finally(() => setIsLoading(false));
							}}>
							<DeleteButton confirm="Are you sure you want to reject this trade?">
								<div class="min-w-[8rem]">Reject offer</div>
							</DeleteButton>
						</form>
					</div>
				</Match>
			</Switch>
		</div>
	);
};
