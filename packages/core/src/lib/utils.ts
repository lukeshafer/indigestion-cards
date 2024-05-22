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
