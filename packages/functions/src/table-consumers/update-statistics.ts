import { setAdminEnvSession } from '@core/lib/session';
import type { DynamoDBStreamHandler } from 'aws-lambda';

export const handler: DynamoDBStreamHandler = async e => {
	setAdminEnvSession('update-statistics-consumer-lambda', 'update-statistics-consumer-lambda');

  for (let record of e.Records) {
    record
  }
};
