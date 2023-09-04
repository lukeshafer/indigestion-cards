/// <reference path="../../.sst/types/index.ts" />

type Union2IntersectionFn<T> = (T extends unknown ? (k: () => T) => void : never) extends (
	k: infer R
) => void
	? R
	: never;
type GetUnionLast<U> = Union2IntersectionFn<U> extends () => infer I ? I : never;

type UnionToTuple<T, R extends any[] = []> = [T] extends [never]
	? R
	: UnionToTuple<Exclude<T, GetUnionLast<T>>, [GetUnionLast<T>, ...R]>;
