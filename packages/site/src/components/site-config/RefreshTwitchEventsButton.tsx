import { createSignal } from 'solid-js';
import { Form, SubmitButton } from '../form/Form';
import { API } from '../../constants';

export default function RefreshTwitchEventsButton() {
	const [buttonText, setButtonText] = createSignal('Refresh Twitch Events');
	const [isDisabled, setIsDisabled] = createSignal(false);

	const refreshTwitchEvents = async () => {
		setIsDisabled(true);
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

		setIsDisabled(false);
		setTimeout(() => {
			setButtonText('Refresh Twitch Events');
		}, 2000);
	};

	return <SubmitButton onClick={refreshTwitchEvents}>{buttonText()}</SubmitButton>;
}
