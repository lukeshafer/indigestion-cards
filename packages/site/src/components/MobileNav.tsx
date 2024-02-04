import type { ParentProps } from 'solid-js';
import CardsIcon from './icons/CardsIcon';
import UserIcon from './icons/UserIcon';
import PacksIcon from './icons/PacksIcon';

export default function MobileNav() {
	return (
		<nav
			class="fixed bottom-0 left-0 right-0 grid h-16 grid-cols-4 bg-black"
			style="z-index: 10">
			<MobileNavLink href="/card">
				<CardsIcon size={28} color="white" />
				Cards
			</MobileNavLink>
			<MobileNavLink href="/user">
				<UserIcon size={28} color="white" />
				Users
			</MobileNavLink>
			<MobileNavLink href="/trades">
				<PacksIcon size={24} color="white" />
				Trades
			</MobileNavLink>
			<MobileNavLink href="/">
				<UserIcon size={28} color="white" />
				My Profile
			</MobileNavLink>
		</nav>
	);
}

function MobileNavLink(props: ParentProps<{ href: string }>) {
	return (
		<a href={props.href} class="grid items-end justify-items-center text-center">
			{props.children}
		</a>
	);
}
