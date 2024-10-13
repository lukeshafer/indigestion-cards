import type { LibraryOutput } from '../session.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pick<Obj extends Record<any, any>, Keys extends ReadonlyArray<keyof Obj>>(
	object: Obj,
	keys: Keys
): Pick<Obj, Keys[number]> {
	// @ts-expect-error We'll build this out
	const output: Pick<Obj, Keys[number]> = {};
	for (const key of keys) {
		output[key] = object[key];
	}

	return output;
}

export function LibraryFn<CB extends (...args: any[]) => any>(
	cb: CB
): (...args: Parameters<CB>) => Promise<LibraryOutput<Awaited<ReturnType<CB>>>> {
	return async (...args: Parameters<CB>) => {
		try {
			return { success: true, data: await cb(...args) };
		} catch (error) {
			return { success: false, error };
		}
	};
}

export function Unwrap<Data>(libraryOutput: Promise<LibraryOutput<Data>>): Promise<Data> {
	return libraryOutput.then(item => {
		if (item.success) {
			return item.data;
		} else {
			throw item.error;
		}
	});
}
