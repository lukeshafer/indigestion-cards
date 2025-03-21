export default function PatreonIcon(props: {
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
				d="M14.82 2.41c3.96 0 7.18 3.24 7.18 7.21c0 3.96-3.22 7.18-7.18 7.18c-3.97 0-7.21-3.22-7.21-7.18c0-3.97 3.24-7.21 7.21-7.21M2 21.6h3.5V2.41H2z"
			/>
		</svg>
	);
}
