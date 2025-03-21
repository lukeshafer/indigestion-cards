export const useViewTransition = <T>(cb: () => T) =>
	document.startViewTransition ? document.startViewTransition(cb) : cb();

export function transformPackTypeName(name: string): string {
	const regex = /season(\d*)default/i;
	const result = name.match(regex);
	const number = result?.[1];

	if (number) {
		return `Season ${number}`;
	}

	return name;
}

export function checkAreAnimationsDisabled(): boolean {
	return (
		window.localStorage.getItem('disableAnimations') === 'true' ||
		document.body.classList.contains('disable-animations')
	);
}
