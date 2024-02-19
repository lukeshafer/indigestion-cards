export default function UserIcon(props: { size?: number | string; color?: string; class?: string }) {
	return (
		<svg
			class={props.class}
			xmlns="http://www.w3.org/2000/svg"
			width={props.size}
			height={props.size}
			viewBox="0 0 16 16">
			<path
				fill="currentColor"
				d="M3 14s-1 0-1-1s1-4 6-4s6 3 6 4s-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z"
			/>
		</svg>
	);
}
