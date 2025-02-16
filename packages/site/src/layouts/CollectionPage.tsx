import type { TwitchUser } from '@core/lib/twitch';
import type { CardInstance, User } from '@core/types';
import type { Component } from 'solid-js';

export const CollectionPage: Component<{
	user: User;
	twitchData: TwitchUser | null;
	isLoggedInUser: boolean;
	cards: Array<CardInstance>;
}> = props => {
	//
};
