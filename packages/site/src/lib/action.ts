/* eslint-disable @typescript-eslint/ban-types */
import type { AstroGlobal } from 'astro';
import { UnauthorizedError, InputValidationError } from '@lil-indigestion-cards/core/lib/errors';
import {
	validateSearchParams,
	type Schema,
	type ParsedOutput,
} from '@lil-indigestion-cards/core/lib/api';

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
      errors: validationResult.errors.map(error => new InputValidationError(error))
    }
  }
  const output = await callback(validationResult.value, ctx)

  return {
    output,
    errors: [],
  }
}

function checkIsAuthorized(ctx: AstroGlobal, authorizationType: AuthorizationType): boolean {
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

type ActionResult<Output> = {
	output: Output | undefined;
	errors: Array<InputValidationError | UnauthorizedError>;
};

type ActionCallback<Output, S extends Schema = {}> = (params: ParsedOutput<S>, ctx: AstroGlobal) => Output;

type AuthorizationType = 'public' | 'user' | 'admin';
