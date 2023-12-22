import { FaBrandsTwitch, FaBrandsYoutube, FaBrandsPatreon } from 'solid-icons/fa';

export default function Footer() {
	return (
		<footer class="grid justify-center gap-1 border-t border-t-gray-300 bg-white py-6 text-center text-sm dark:border-t-gray-800 dark:bg-gray-950">
			<nav class="flex items-center gap-12">
				<a
					href="https://twitch.tv/lil_indigestion"
					target="_blank"
					class="hover:brightness-90"
					title="Twitch">
					<FaBrandsTwitch class="text-brand-main " size="36" />
					<span class="sr-only">Twitch</span>
				</a>
				<a
					href="https://www.youtube.com/@lilindigestion"
					target="_blank"
					class="hover:brightness-90"
					title="YouTube">
					<FaBrandsYoutube class="text-brand-main " size="40" />
					<span class="sr-only">YouTube</span>
				</a>
				<a
					href="https://www.patreon.com/lil_indigestion"
					target="_blank"
					class="hover:brightness-90"
					title="Patreon">
					<FaBrandsPatreon class="text-brand-main " size="33" />
					<span class="sr-only">Patreon</span>
				</a>
			</nav>
			<p class="text-gray-900 dark:text-gray-50">
				&copy; {new Date().getFullYear()} lil_indigestion
			</p>
		</footer>
	);
}
