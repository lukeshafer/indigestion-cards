export const useViewTransition = (cb: () => any) =>
	// @ts-ignore
	document.startViewTransition ? document.startViewTransition(cb) : cb();
