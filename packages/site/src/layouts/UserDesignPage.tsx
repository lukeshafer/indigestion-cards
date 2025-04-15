import * as Solid from 'solid-js';
import type * as DB from '@core/types';
import CardList from '@site/components/CardList';
import type {TwitchUser} from '@core/lib/twitch';
import * as Text from '@site/components/text';
import * as Constants from '@site/constants';
import { CardInstanceComponent } from '@site/components/Card';

const IMG_SIZE = 60;
export const UserDesignPage: Solid.Component<{
	user: DB.User;
	twitchData: TwitchUser | null;
	design: DB.CardDesign;
	cards: Array<DB.CardInstance>;
	isLoggedInUser: boolean;
}> = props => {
	return (
		<div class="grid-cols-[1fr_50rem_1fr] md:grid">
			<section class="flex items-center gap-4 self-start">
				<img
					alt={`${props.user.username}'s profile image`}
					style={{ 'view-transition-name': `${props.user.userId}-user-profile-image` }}
					src={props.twitchData?.profile_image_url}
					width={IMG_SIZE}
					height={IMG_SIZE}
					class="rounded-full"
				/>
				<div>
					<h2 class="font-display text-xl italic">{props.user.username}</h2>
					<p class="font-display text-brand-main -mt-2">cards</p>
				</div>
			</section>
			<section class="">
				<header class="my-6 text-center">
					<Text.PageTitle>{props.design.cardName}</Text.PageTitle>
				</header>

				<main>
					<CardList.List cards={props.cards} scale={0.8}>
						{(card, index) => (
							<a
								href={`${Constants.routes.USERS}/${card.username?.toLowerCase()}/${card.instanceId ?? ''}`}
								class="outline-brand-main group inline-block transition-transform hover:-translate-y-2">
								<CardInstanceComponent card={card} lazy={index() > 10} />
							</a>
						)}
					</CardList.List>
				</main>
			</section>
		</div>
	);
};
