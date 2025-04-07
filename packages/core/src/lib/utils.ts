import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Bucket } from 'sst/node/bucket';
import type { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pick<Obj extends Record<any, any>, Keys extends ReadonlyArray<keyof Obj>>(
	object: Obj,
	keys: Keys
): Pick<Obj, Keys[number]> {
	// @ts-expect-error We'll build this out
	const output: Pick<Obj, Keys[number]> = {};
	for (const key of keys) {
		output[key] = object[key];
	}

	return output;
}

export class Summary<T> {
	static #s3: null | S3Client = null;
	static get s3(): S3Client {
		if (Summary.#s3 == null) {
			Summary.#s3 = new S3Client();
		}
		return Summary.#s3;
	}

	prefix: string;
	schema: z.ZodSchema<T>;
	loader: (key: string) => Promise<T>;
	constructor(args: {
		schema: z.ZodSchema<T>;
		prefix: string;
		loader: (key: string) => Promise<T>;
	}) {
		this.schema = args.schema;
		this.prefix = args.prefix;
		this.loader = args.loader;
	}

	async refresh(key: string): Promise<T> {
		console.log(`Refreshing ${this.prefix}/${key}`);
		const unparsed = await this.loader(key);

		console.log(`Data retrieved.`);
		let data = this.schema.parse(unparsed);
		console.log(`Data parsed`);

		await Summary.s3.send(
			new PutObjectCommand({
				Bucket: Bucket.DataSummaries.bucketName,
				Key: `${this.prefix}/${key}`,
				Body: JSON.stringify(data),
			})
		).catch(e => {
      console.error(e);
      console.error("An error occurred while putting object in s3.")
    });

		return data;
	}

	async get(key: string): Promise<T> {
		const path = `${this.prefix}/${key}`;
		console.log(`Attempting to fetch ${path} from S3`);
		let body;
		try {
			let object = await Summary.s3.send(
				new GetObjectCommand({
					Bucket: Bucket.DataSummaries.bucketName,
					Key: path,
				})
			);
			body = await object.Body?.transformToString();
			if (body == undefined) {
				throw new Error('Body not found.');
			}
		} catch (e) {
			console.error(e);
			console.log(`Unable to locate ${path}. Generating...`);
			const data = await this.refresh(key);

			return data;
		}

		let result = this.schema.safeParse(JSON.parse(body));

		if (result.success === false) {
			console.log(`Existing ${path} uses invalid schema. Re-generating...`);
			return this.refresh(key);
		}

		return result.data;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazy<T extends Record<any, any>>(getter: () => T): T {
	let object: T | null = null;

	return new Proxy<T>({} as T, {
		get(_, p: keyof T) {
			if (object == null) object = getter();
			return object[p];
		},
	});
}
