export const useViewTransition = (cb: () => unknown) =>
	document.startViewTransition ? document.startViewTransition(cb) : cb();

