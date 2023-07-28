import { createSignal } from 'solid-js';
import { Form, SubmitButton } from '../form/Form';
import { api } from '../../constants';

export default function RefreshTwitchEventsButton() {
	const [buttonText, setButtonText] = createSignal('Refresh Twitch Events');
	const [isDisabled, setIsDisabled] = createSignal(false);

	const refreshTwitchEvents = async () => {
		setIsDisabled(true);
		setButtonText('Refreshing...');
		const response = await fetch(api.REFRESH_TWITCH_EVENTS, { method: 'POST' });

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
