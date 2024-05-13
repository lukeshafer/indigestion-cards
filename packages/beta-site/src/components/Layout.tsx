import { useContext } from "solid-js"
import { PageContext } from "~/app"
import { ASSETS } from "~/constants";
import { getRequestEvent } from 'solid-js/web'

const LOGOS = {
	default: ASSETS.LOGO,
	tongle: ASSETS.TONGLE,
} satisfies Record<string, string>;

export function Header() {
  const ctx = useContext(PageContext)
  const event = getRequestEvent()
  event.locals

return (
<div class="border-b border-b-gray-300 bg-white dark:border-b-gray-800 dark:bg-gray-950">
	<header
		class="max-w-main relative mx-auto flex items-center gap-4 px-4 py-2 text-white md:py-4">
		<nav
			class="scrollbar-hidden flex flex-1 items-center gap-2 overflow-x-scroll text-black md:gap-4">
			<a href="/" title="Home" class="mr-4 flex w-fit min-w-[2rem] items-center gap-4">
				<img
					src={LOGOS[ctx.logo]}
					alt="logo"
					class={`block w-12 ${ctx.logo === 'default' ? 'dark:invert' : ''}`}
					width="192"
				/>
				<div class="font-display hidden flex-1 flex-col pt-1 sm:flex">
					<span class="text-brand-main mt-1 text-2xl lowercase italic">Indigestion</span>
					<span class="-mt-2 text-lg lowercase text-gray-700 dark:text-gray-200"
						>Cards</span
					>
				</div>
			</a>
			{
				Astro.locals.session?.type === 'admin' ? (
					<HeaderLink href={routes.ADMIN.OPEN_PACKS} title="Open Packs">
						Open Packs
						<TotalPackCount client:only="solid-js" />
					</HeaderLink>
				) : null
			}
			<HeaderLink href={routes.CARDS} title="Cards">Cards</HeaderLink>
			<HeaderLink href={routes.USERS} title="Users">Users</HeaderLink>
			<Show when={canSeeTradesLink}>
				<HeaderLink href={routes.TRADES} title="Trades">
					<TradeNotificationCount username={username!} transition:persist client:only="solid-js" />
					My Trades
				</HeaderLink>
			</Show>
		</nav>
		<UserSearch client:load transition:persist />
		<UserConfig client:load {disableAnimations} user={twitchData} />
	</header>
</div>
)
}
