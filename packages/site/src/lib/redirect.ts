import type { AstroGlobal } from "astro";

interface Props {
	Astro: AstroGlobal;
	to: string;
	alert?: string;
	type?: string;
}

/** Redirects the user to a new page using the `HX-Redirect` header. Intended to be used as an Astro component. */
export default function Redirect({ Astro, to, alert, type }: Props) {
	const url = new URL(to, Astro.url.origin);

	if (alert) url.searchParams.set('alert', alert);
	if (type) url.searchParams.set('type', type);

	Astro.response.headers.set('HX-Redirect', url.toString());
}
