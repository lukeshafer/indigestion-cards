import { ApiHandler, useFormData } from 'sst/node/api';
import { useSession } from 'sst/node/future/auth';
import { setAdminEnvSession } from './user';

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

type SchemaType = 'string' | 'number' | 'boolean';

interface Schema {
	[key: string]: SchemaType | [SchemaType, 'optional'];
}

type ParsedOutput<SchemaToCheck extends Schema> = {
	[key in keyof SchemaToCheck]: SchemaToCheck[key] extends [SchemaType, 'optional']
	? Types[SchemaToCheck[key][0]] | undefined
	: // @ts-ignore
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
		const value = params.get(key);

		if (Array.isArray(type)) {
			if (!value) {
				result[key] = undefined;
				continue;
			}
			type = type[0];
		} else if (!value) {
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
}

function parseType<TypeToCheck extends SchemaType>(
	value: string,
	type: TypeToCheck
): Types[TypeToCheck] {
	switch (type) {
		case 'string':
			return value as Types[TypeToCheck];
		case 'number':
			if (isNaN(Number(value))) throw new Error('Not a number');
			return Number(value) as Types[TypeToCheck];
		case 'boolean':
			return (value === 'true') as Types[TypeToCheck];
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
