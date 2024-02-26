import { useLocation } from '@solidjs/router';
import type { ParentProps } from 'solid-js';
import { transitionname } from '@/lib/client/utils';
() => void transitionname;

export default function HeaderLink(
	props: ParentProps<{
		href: string;
		title: string;
	}>
) {
	const location = useLocation();

	const url = () => new URL(props.href, 'https://example.com/');

	return (
		<a
			href={url().pathname + url().search}
			title={props.title}
			use:transitionname={`page-header-nav-${props.href}`}
			class="relative rounded px-2 py-1 transition-colors"
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
