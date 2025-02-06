export default function TradeOutIcon(props: {
	size?: number | string;
	class?: string;
	title: string;
}) {
	return (
		<svg
			class={props.class}
			xmlns="http://www.w3.org/2000/svg"
			width={props.size}
			height={props.size}
			viewBox="0 0 24 24">
			<title>{props.title}</title>
			<path
				fill="currentColor"
				d="m23 12l-4-4v3h-9v2h9v3M1 18V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3h-2V6H3v12h12v-3h2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2"
			/>
		</svg>
	);
}
