export default function MoonIcon(props: {
	size?: number | string;
	color?: string;
	class?: string;
}) {
	return (
		<svg
			class={props.class}
			xmlns="http://www.w3.org/2000/svg"
			width={props.size}
			height={props.size}
			viewBox="0 0 24 24">
			<path
				fill="currentColor"
				fill-rule="evenodd"
				d="M9.528 1.718a.75.75 0 0 1 .162.819A9 9 0 0 0 9 6a9 9 0 0 0 9 9a9 9 0 0 0 3.463-.69a.75.75 0 0 1 .981.98a10.5 10.5 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5c0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162"
				clip-rule="evenodd"
			/>
		</svg>
	);
}
