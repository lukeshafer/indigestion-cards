import { useLocation } from '@solidjs/router';
import type { ParentProps } from 'solid-js';

export default function HeaderLink(
	props: ParentProps<{
		href: string;
		title: string;
	}>
) {
	const location = useLocation();
	return (
		<a
			href={props.href}
			title={props.title}
			class="relative rounded px-2 py-1 transition-colors"
			style={{ 'view-transition-name': `page-header-nav-${props.href}` }}
			classList={{
				'text-brand-main bg-brand-100 dark:bg-brand-dark dark:hover:bg-brand-900 dark:hover:text-brand-main hover:bg-brand-200 hover:text-brand-dark font-bold dark:text-white':
					location.pathname.startsWith(props.href),
				'text-gray-700 hover:bg-gray-200 hover:text-black dark:font-medium dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white':
					!location.pathname.startsWith(props.href),
			}}>
			{props.children || props.title}
		</a>
	);
}
