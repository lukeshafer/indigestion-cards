type SchemaType = keyof Types;

export type Schema = {
  [key: string]: SchemaType;
};

export type ParsedOutput<SchemaToCheck extends Schema> = {
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

export function validateSearchParams<SchemaToCheck extends Schema>(
  params: URLSearchParams | string,
  schema: SchemaToCheck,
): Result<SchemaToCheck> {
  if (typeof params === "string") {
    params = new URLSearchParams(params);
  }

  console.log("Validating search params", { params, schema });
  const result: Record<string, Types[SchemaType] | undefined> = {};
  const errors: string[] = [];
  for (const key in schema) {
    let type = schema[key] as SchemaType;
    const value = params.getAll(key) || undefined;

    if (!type.endsWith("[]") && !value.length && !type.endsWith("?")) {
      errors.push(`Missing ${key}.`);
      continue;
    }

    try {
      result[key] = parseType(value, type);
    } catch {
      errors.push(`Invalid ${key}.`);
    }
  }

  if (errors.length) {
    console.log("Validation failed", { errors });
    return { success: false, errors };
  }
  console.log("Validation succeeded", { result });
  return { success: true, value: result as ParsedOutput<SchemaToCheck> };
}

interface Types {
  string: string;
  number: number;
  boolean: boolean;
  "string?": string | undefined;
  "number?": number | undefined;
  "boolean?": boolean | undefined;
  "string[]": string[];
  "number[]": number[];
  "boolean[]": boolean[];
}

function parseType<TypeToCheck extends SchemaType>(
  value: string[],
  type: TypeToCheck,
): Types[TypeToCheck] {
  const isOptional = type.endsWith("?");
  if (isOptional) type = type.slice(0, -1) as TypeToCheck;

  const isArray = type.endsWith("[]");
  if (isArray) type = type.slice(0, -2) as TypeToCheck;

  if (!value.length) {
    // @ts-expect-error - [] is a valid type if isArray is true
    if (isArray) return [] as Types[TypeToCheck];
    if (isOptional) return undefined as Types[TypeToCheck];
    throw new Error("Missing value");
  }

  if (isArray) {
    // @ts-expect-error - this is fine
    return value.map((v) => parseType([v], type)) as Types[TypeToCheck];
  }

  switch (type) {
    case "string":
      return value[0] as Types[TypeToCheck];
    case "number":
      if (isNaN(Number(value[0]))) throw new Error("Not a number");
      return Number(value[0]) as Types[TypeToCheck];
    case "boolean":
      return (value[0] === "true") as Types[TypeToCheck];
  }

  throw new Error("Invalid type");
}
