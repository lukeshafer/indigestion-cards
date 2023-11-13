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

type SchemaType = keyof Types;

interface Schema {
	[key: string]: SchemaType;
}

type ParsedOutput<SchemaToCheck extends Schema> = {
	[key in keyof SchemaToCheck]: Types[SchemaToCheck[key]];
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

function useValidateFormData<SchemaToCheck extends Schema>(
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
		let type = schema[key] as SchemaType;
		const value = params.getAll(key) || undefined;

		if (!type.endsWith('[]') && !value.length && !type.endsWith('?')) {
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
		// @ts-expect-error - this is fine
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

type Callback = Parameters<typeof ApiHandler>[0];
type SiteHandlerContext<T extends Schema, A extends AuthorizationType> = Parameters<Callback>[1] & {
	params: ParsedOutput<T>;
	session: A extends 'public'
	? undefined
	: {
		userId: string;
		username: string;
	};
};

type AuthorizationType = 'public' | 'user' | 'admin';

// eslint-disable-next-line @typescript-eslint/ban-types
type SiteHandlerCallback<S extends Schema = {}, A extends AuthorizationType = 'public'> = (
	evt: Parameters<Callback>[0],
	ctx: SiteHandlerContext<S, A>
) => ReturnType<Callback>;
type SiteHandlerOptions<S extends Schema, A extends AuthorizationType> = {
	authorizationType?: A;
	schema?: S;
};

export function SiteHandler<T extends Schema, A extends AuthorizationType>(
	options: SiteHandlerOptions<T, A>,
	callback: SiteHandlerCallback<T, A>
): ReturnType<typeof ApiHandler>;
export function SiteHandler(options: SiteHandlerCallback): ReturnType<typeof ApiHandler>;
export function SiteHandler<T extends Schema, A extends AuthorizationType>(
	options: SiteHandlerOptions<T, A> | SiteHandlerCallback,
	callback?: SiteHandlerCallback<T, A>
) {
	if (typeof options === 'function') {
		// @ts-expect-error - handled by function overload
		callback = options;
		options = {};
	}

	if (!callback) throw new Error('Missing callback');

	const { authorizationType = 'public', schema } = options;

	return ApiHandler(async (evt, ctxOrig) => {
		const ctx = ctxOrig as SiteHandlerContext<T, A>;
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

			// @ts-expect-error - the session properties are verified in the above statement
			ctx.session = session.properties;
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
