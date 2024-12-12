export default function LockIcon(props: { size?: number; color?: string; class?: string }) {
	return (
		<svg
			class={props.class}
			xmlns="http://www.w3.org/2000/svg"
			width={props.size}
			height={props.size}
			viewBox="0 0 1152 1408">
			<path
				fill="currentColor"
				d="M320 640h512V448q0-106-75-181t-181-75t-181 75t-75 181zm832 96v576q0 40-28 68t-68 28H96q-40 0-68-28t-28-68V736q0-40 28-68t68-28h32V448q0-184 132-316T576 0t316 132t132 316v192h32q40 0 68 28t28 68"
			/>
		</svg>
	);
}
