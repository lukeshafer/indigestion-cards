import { SecretsManager } from 'aws-sdk'
const secretsManager = new SecretsManager({ region: 'us-east-2' })

export async function getSecret(secretName: string) {
	const result = await secretsManager.getSecretValue({ SecretId: secretName }).promise()
	return result.SecretString
}

export async function createSecret(secretName: string, secretValue: string) {
	await secretsManager.createSecret({ Name: secretName, SecretString: secretValue }).promise()
}
