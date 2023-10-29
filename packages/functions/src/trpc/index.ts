import { router } from './trpc';
import {
	awsLambdaRequestHandler,
	type CreateAWSLambdaContextOptions,
} from '@trpc/server/adapters/aws-lambda';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { trades } from './routes/trades';
import { cards } from './routes/cards';

const createContext = ({
	event,
	context,
}: CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>) => ({ event, context });

const appRouter = router({ trades, cards });

export type AppRouter = typeof appRouter;

export const handler = awsLambdaRequestHandler({
	router: appRouter,
	createContext,
});
