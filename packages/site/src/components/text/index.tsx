import type { JSX } from 'solid-js';
import type { ParentProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';

export { Anchor } from '@/components/form';

export function PageHeader(props: ParentProps) {
	return (
		<header class="max-w-main mb-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-1">
			{props.children}
		</header>
	);
}

export function PageTitle(
	props: ParentProps<
		{
			heading?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
		} & JSX.HTMLAttributes<HTMLHeadingElement>
	>
) {
	return (
		<Dynamic
			{...props}
			component={props.heading ?? 'h1'}
			class="font-heading my-2 text-3xl font-bold uppercase">
			{props.children}
		</Dynamic>
	);
}

export function Heading(
	props: ParentProps<
		{
			heading?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
		} & JSX.HTMLAttributes<HTMLHeadingElement>
	>
) {
	return (
		<Dynamic
			{...props}
			component={props.heading ?? 'h2'}
			class="font-heading my-2 text-2xl font-semibold">
			{props.children}
		</Dynamic>
	);
}
