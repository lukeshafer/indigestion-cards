export default function CardListLoader(props: { load: () => Promise<any>; children?: string }) {
	return (
		<button
			class="border-brand-main relative m-8 mx-auto w-full max-w-52 border p-2"
			onClick={() => props.load()}>
			<div
				class="absolute -top-96 h-px w-px bg-red-500"
				ref={div => {
					const observer = new IntersectionObserver(entries => {
						for (let entry of entries) {
							if (entry.isIntersecting) {
								const viewportHeight = entry.rootBounds?.height ?? 0;
								(function load(count = 0) {
									props.load().then(() => {
										if (!entry.target.checkVisibility()) {
											return;
										}
										if (count > 50)
											throw new Error(
												'Loaded too many times: there is likely a bug'
											);
										setTimeout(() => {
											if (
												entry.target.getBoundingClientRect().top <
												viewportHeight
											) {
												load(count + 1);
											}
										}, 50);
									});
								})();
							}
						}
					});

					observer.observe(div);
					observer.takeRecords;
				}}
			/>
			{props.children || 'Click to load more'}
		</button>
	);
}
