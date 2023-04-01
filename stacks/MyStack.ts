import { StackContext, Api, Config } from "sst/constructs";

export function API({ stack }: StackContext) {
	const api = new Api(stack, "api", {
		routes: {
			"GET /": "packages/functions/src/twitch-api.handler",
			"POST /": "packages/functions/src/twitch-api.handler",
		},
		defaults: {
			function: {
				bind: [
					new Config.Secret(stack, "TWITCH_CLIENT_ID"),
					new Config.Secret(stack, "TWITCH_CLIENT_SECRET"),
					new Config.Secret(stack, "TWITCH_ACCESS_TOKEN"),
				],
			},
		},
	});
	stack.addOutputs({
		ApiEndpoint: api.url,
	});
}
