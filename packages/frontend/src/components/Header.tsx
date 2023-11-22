import { A } from '@solidjs/router';
import { For } from 'solid-js';
import { useLocation } from 'solid-start';
import { ASSETS } from '~/lib/constants';

export default function Header() {
	const headerLinks = [
		{ href: '/card', title: 'Cards' },
		{ href: '/user', title: 'Users' },
	];

	const location = useLocation();

	return (
		<div class="border-b border-b-gray-300 bg-white dark:border-b-gray-800 dark:bg-gray-950">
			<header class="max-w-main relative mx-auto flex items-center gap-4 px-4 py-2 text-white md:py-4">
				<nav class="scrollbar-hidden flex flex-1 items-center gap-2 overflow-x-scroll text-black md:gap-4">
					<A
						href="/"
						title="Home"
						class="mr-4 flex w-fit min-w-[2rem] items-center gap-4"
						style={{ 'view-transition-name': 'page-header-home-link' }}>
						<img
							src={ASSETS.LOGO}
							alt="logo"
							class="block w-12 dark:invert"
							width="192"
						/>
						<div class="font-display hidden flex-1 flex-col pt-1 sm:flex">
							<span class="text-brand-main mt-1 text-2xl italic">indigestion</span>
							<span class="-mt-2 text-lg text-gray-700 dark:text-gray-200">
								cards
							</span>
						</div>
					</A>
					<For each={headerLinks}>
						{(link) => (
							<A
								href={link.href}
								title={link.title}
								style={{ 'view-transition-name': `page-header-nav-${link.href}` }}
								class="relative rounded px-2 py-1 transition-colors "
								classList={{
									'text-brand-main bg-brand-100 dark:bg-brand-dark dark:hover:bg-brand-900 dark:hover:text-brand-main hover:bg-brand-200 hover:text-brand-dark font-bold dark:text-white':
										location.pathname.startsWith(link.href),
									'text-gray-700 hover:bg-gray-200 hover:text-black dark:font-medium dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white':
										!location.pathname.startsWith(link.href),
								}}>
								{link.title}
							</A>
						)}
					</For>
				</nav>
			</header>
		</div>
	);
}
