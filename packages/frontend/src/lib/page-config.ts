import { isServer } from 'solid-js/web';
import { parseCookie, useServerContext } from 'solid-start';

export const color_theme = () => (isServer ? cookie().theme : (localStorage.theme as string));

export const cookie = () =>
	parseCookie(
		isServer ? useServerContext().request?.headers?.get('cookie') ?? '' : document.cookie
	);
