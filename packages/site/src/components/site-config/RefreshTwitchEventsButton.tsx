import { createSignal } from 'solid-js';
import { SubmitButton } from '../form/Form';
import { API } from '../../constants';

export default function RefreshTwitchEventsButton() {
	const [buttonText, setButtonText] = createSignal('Refresh Twitch Events');
	let isDisabled = false;

	const refreshTwitchEvents = async () => {
		if (isDisabled) return;
		isDisabled = true;
		setButtonText('Refreshing...');
		const auth_token = localStorage.getItem('auth_token') || '';
		const response = await fetch(API.REFRESH_TWITCH_EVENTS, {
			method: 'POST',
			headers: {
				Authorization: auth_token ? `Bearer ${auth_token}` : '',
			},
		});

		if (!response.ok) {
			setButtonText('Error refreshing Twitch events');
		} else {
			setButtonText('Refreshed Twitch events');
		}

		isDisabled = false;
		setTimeout(() => {
			setButtonText('Refresh Twitch Events');
		}, 2000);
	};

	return <SubmitButton onClick={refreshTwitchEvents}>{buttonText()}</SubmitButton>;
}
