import { migration as secretsToSSM } from './secrets-to-ssm';
import { migration as cardInstance1to2 } from './card-instance-1-to-2';

export async function migration() {
	await secretsToSSM();
  await cardInstance1to2();
}
