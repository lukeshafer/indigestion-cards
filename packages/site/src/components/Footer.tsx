import type { Component } from 'solid-js';
import TwitchIcon from './icons/TwitchIcon';
import YoutubeIcon from './icons/YoutubeIcon';
import PatreonIcon from './icons/PatreonIcon';

export const Footer: Component = () => {
	return (
		<footer class="grid justify-center gap-1 border-t border-t-gray-300 bg-white py-6 text-center text-sm dark:border-t-gray-800 dark:bg-gray-950">
			<nav class="flex items-center gap-8">
				<a
					href="https://twitch.tv/lil_indigestion"
					target="_blank"
					class="hover:brightness-90"
					title="Twitch">
					<TwitchIcon class="text-brand-main w-11" size={44} />
					<span class="sr-only">Twitch</span>
				</a>
				<a
					href="https://www.youtube.com/@lilindigestion"
					target="_blank"
					class="hover:brightness-90"
					title="YouTube">
					<YoutubeIcon class="text-brand-main w-12" size={48} />
					<span class="sr-only">YouTube</span>
				</a>
				<a
					href="https://www.patreon.com/lil_indigestion"
					target="_blank"
					class="hover:brightness-90"
					title="Patreon">
					<PatreonIcon class="text-brand-main w-10" size={40} />
					<span class="sr-only">Patreon</span>
				</a>
			</nav>
			<p>&copy; 2023 - {new Date().getFullYear()} lil_indigestion</p>
		</footer>
	);
};
