import { ApiHandler, useFormData } from 'sst/node/api';
import { useSession } from 'sst/node/future/auth';
import { setAdminEnvSession } from './session';

declare module 'sst/node/future/auth' {
	export interface SessionTypes {
		user: {
			userId: string;
			username: string;
		};
		admin: {
			userId: string;
			username: string;
		};
	}
}

type SchemaType = keyof Types

interface Schema {
	[key: string]: SchemaType | [SchemaType, 'optional'];
}

type ParsedOutput<SchemaToCheck extends Schema> = {
	[key in keyof SchemaToCheck]: SchemaToCheck[key] extends [SchemaType, 'optional']
	? Types[SchemaToCheck[key][0]] | undefined
	: // @ts-expect-error - key is a key of SchemaToCheck
	Types[SchemaToCheck[key]];
};

type Result<SchemaToCheck extends Schema> =
	| {
		success: true;
		value: ParsedOutput<SchemaToCheck>;
	}
	| {
		success: false;
		errors: string[];
	};

export function useValidateFormData<SchemaToCheck extends Schema>(
	schema: SchemaToCheck
): Result<SchemaToCheck> {
	const params = useFormData();
	if (!params) return { success: false, errors: ['Missing form data.'] };

	return validateSearchParams(params, schema);
}

export function validateSearchParams<SchemaToCheck extends Schema>(
	params: URLSearchParams,
	schema: SchemaToCheck
): Result<SchemaToCheck> {
	console.log('Validating search params', { params, schema });
	const result: Record<string, Types[SchemaType] | undefined> = {};
	const errors: string[] = [];
	for (const key in schema) {
		let type = schema[key] as SchemaType | [SchemaType, 'optional'];
		const value = params.getAll(key) || undefined;

		if (Array.isArray(type)) {
			if (!value) {
				result[key] = undefined;
				continue;
			}
			type = type[0];
		} else if (!value.length && !type.endsWith('?')) {
			errors.push(`Missing ${key}.`);
			continue;
		}

		try {
			result[key] = parseType(value, type);
		} catch (e) {
			errors.push(`Invalid ${key}.`);
		}
	}

	if (errors.length) {
		console.log('Validation failed', { errors });
		return { success: false, errors };
	}
	console.log('Validation succeeded', { result });
	return { success: true, value: result as ParsedOutput<SchemaToCheck> };
}

interface Types {
	string: string;
	number: number;
	boolean: boolean;
	'string?': string | undefined;
	'number?': number | undefined;
	'boolean?': boolean | undefined;
	'string[]': string[];
	'number[]': number[];
	'boolean[]': boolean[];
}

function parseType<TypeToCheck extends SchemaType>(
	value: string[],
	type: TypeToCheck
): Types[TypeToCheck] {
	const isOptional = type.endsWith('?');
	if (isOptional) type = type.slice(0, -1) as TypeToCheck;

	const isArray = type.endsWith('[]');
	if (isArray) type = type.slice(0, -2) as TypeToCheck;

	if (!value.length) {
		// @ts-expect-error - [] is a valid type if isArray is true
		if (isArray) return [] as Types[TypeToCheck];
		if (isOptional) return undefined as Types[TypeToCheck];
		throw new Error('Missing value');
	}

	if (isArray) {
		return value.map((v) => parseType([v], type)) as Types[TypeToCheck];
	}

	switch (type) {
		case 'string':
			return value[0] as Types[TypeToCheck];
		case 'number':
			if (isNaN(Number(value[0]))) throw new Error('Not a number');
			return Number(value[0]) as Types[TypeToCheck];
		case 'boolean':
			return (value[0] === 'true') as Types[TypeToCheck];
	}

	throw new Error('Invalid type');
}

export const ProtectedApiHandler: typeof ApiHandler = (callback) => {
	return ApiHandler(async (...args) => {
		console.log('Checking session');
		const session = useSession();
		if (session.type !== 'admin') {
			console.log('Unauthorized', { session });
			return {
				statusCode: 401,
				body: 'Unauthorized',
			};
		}
		setAdminEnvSession(session.properties.username, session.properties.userId);

		return callback(...args);
	});
};

export const UserProtectedApiHandler: typeof ApiHandler = (callback) => {
	return ApiHandler(async (...args) => {
		console.log('Checking session');
		const session = useSession();
		if (session.type !== 'admin' && session.type !== 'user') {
			console.log('Unauthorized', { session });
			return {
				statusCode: 401,
				body: 'Unauthorized',
			};
		}
		setAdminEnvSession(session.properties.username, session.properties.userId);

		return callback(...args);
	});
};

type Callback = Parameters<typeof ApiHandler>[0];
type SiteHandlerContext<T extends Schema> = Parameters<Callback>[1] & {
	params: ParsedOutput<T>;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type SiteHandlerCallback<S extends Schema = {}> = (
	evt: Parameters<Callback>[0],
	ctx: SiteHandlerContext<S>
) => ReturnType<Callback>;
type SiteHandlerOptions<S extends Schema> = {
	authorizationType?: 'public' | 'user' | 'admin';
	schema?: S;
};
export function SiteHandler<T extends Schema>(
	options: SiteHandlerOptions<T>,
	callback: SiteHandlerCallback<T>
): ReturnType<typeof ApiHandler>;
export function SiteHandler(options: SiteHandlerCallback): ReturnType<typeof ApiHandler>;
export function SiteHandler<T extends Schema>(
	options: SiteHandlerOptions<T> | SiteHandlerCallback,
	callback?: SiteHandlerCallback<T>
) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}

	if (!callback) throw new Error('Missing callback');

	const { authorizationType = 'public', schema } = options;

	return ApiHandler(async (evt, ctxOrig) => {
		const ctx = ctxOrig as SiteHandlerContext<T>;
		if (authorizationType !== 'public') {
			const session = useSession();

			if (
				!authorizationMap[authorizationType].includes(session.type) ||
				session.type === 'public'
			) {
				console.log('Unauthorized', { session });
				return {
					statusCode: 401,
					body: 'Unauthorized',
				};
			}

			setAdminEnvSession(session.properties.username, session.properties.userId);
		}

		if (schema) {
			const params = useValidateFormData(schema);
			if (!params.success) {
				console.error('Invalid params', { params });
				return {
					statusCode: 400,
					body: params.errors.join(' '),
				};
			}
			ctx.params = params.value;
		}

		return callback!(evt, ctx);
	});
}

const authorizationMap = {
	public: ['public', 'user', 'admin'],
	user: ['user', 'admin'],
	admin: ['admin'],
};
