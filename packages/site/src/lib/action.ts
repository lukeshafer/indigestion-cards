/* eslint-disable @typescript-eslint/ban-types */
import type { APIContext, APIRoute, AstroGlobal } from 'astro';
import { UnauthorizedError, InputValidationError } from '@core/lib/errors';
import {
	validateSearchParams,
	type Schema,
	type ParsedOutput,
} from '@core/lib/api';

export function createApiRoute<A extends AuthorizationType = 'admin', S extends Schema = {}>(
	options: ApiRouteOptions<A, S>,
	callback: ApiRouteCallback<S>
) {
	const {
		authorizationType = 'admin' as A,
		schema = {} as S,
		validationErrorResponse,
		authorizationErrorResponse,
	} = options;

	const routeFunction: APIRoute = async ctx => {
		const isAuthorized = checkIsAuthorized(ctx, authorizationType);
		if (!isAuthorized) {
			if (authorizationErrorResponse) return authorizationErrorResponse(ctx);
			else return ctx.redirect('/?alert=Unauthorized&type=error');
		}

		const searchParams =
			ctx.request.method === 'GET'
				? ctx.url.searchParams
				: new URLSearchParams(await ctx.request.text());

		const validationResult = validateSearchParams(searchParams, schema);
		if (!validationResult.success) {
			if (validationErrorResponse)
				return validationErrorResponse(ctx, validationResult.errors);
			else
				return new Response(validationResult.errors.join(','), {
					status: 400,
				});
		}

		return callback(validationResult.value, ctx);
	};

	return routeFunction;
}

export async function Action<Output, A extends AuthorizationType = 'admin', S extends Schema = {}>(
	ctx: AstroGlobal,
	options: ActionOptions<A, S>,
	callback: ActionCallback<Output, S>
): Promise<ActionResult<Awaited<Output>>> {
	const { authorizationType = 'admin' as A, method, schema = {} as S } = options;

	if (method !== ctx.request.method)
		return {
			output: undefined,
			errors: [],
		};

	const isAuthorized = checkIsAuthorized(ctx, authorizationType);
	if (!isAuthorized)
		return {
			output: undefined,
			errors: [new UnauthorizedError('Not authorized for this action.')],
		};

	const searchParams =
		ctx.request.method === 'GET'
			? ctx.url.searchParams
			: new URLSearchParams(await ctx.request.text());

	const validationResult = validateSearchParams(searchParams, schema);

	if (!validationResult.success) {
		return {
			output: undefined,
			errors: validationResult.errors.map(error => new InputValidationError(error)),
		};
	}
	const output = await callback(validationResult.value, ctx);

	return {
		output,
		errors: [],
	};
}

export function checkIsAuthorized(
	ctx: AstroGlobal | APIContext,
	authorizationType: AuthorizationType
): boolean {
	if (authorizationType === 'public') return true;
	if (authorizationType === 'user')
		return ctx.locals.session?.type === 'admin' || ctx.locals.session?.type === 'user';
	if (authorizationType === 'admin') return ctx.locals.session?.type === 'admin';

	// the below should never trigger, but as a fallback we will say unauthorized
	return false;
}

// TYPE DECLARATIONS BELOW
type ActionOptions<A extends AuthorizationType, S extends Schema> = {
	method: 'GET' | 'POST';
	authorizationType?: A;
	schema?: S;
};

type ApiRouteOptions<A extends AuthorizationType, S extends Schema> = {
	authorizationType?: A;
	schema?: S;
	validationErrorResponse?: (ctx: APIContext, errors: string[]) => Response;
	authorizationErrorResponse?: (ctx: APIContext) => Response;
};

type ActionResult<Output> = {
	output: Output | undefined;
	errors: Array<InputValidationError | UnauthorizedError>;
};

type ActionCallback<Output, S extends Schema = {}> = (
	params: ParsedOutput<S>,
	ctx: AstroGlobal
) => Output;

type ApiRouteCallback<S extends Schema = {}> = (
	params: ParsedOutput<S>,
	ctx: APIContext
) => ReturnType<APIRoute>;

type AuthorizationType = 'public' | 'user' | 'admin';
