import type { TwitchUser } from '@core/lib/twitch';
import type { CardInstance, Collection, User } from '@core/types';
import { For, type Component } from 'solid-js';

export const CollectionPage: Component<{
	user: User;
	twitchData: TwitchUser | null;
	isLoggedInUser: boolean;
	cards: Array<CardInstance>;
	collection: Collection;
}> = props => {
	return (
		<ul>
			<For each={props.cards}>{card => <li>{card.cardName}</li>}</For>
		</ul>
	);
};
