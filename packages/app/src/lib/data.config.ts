import { APIEvent, APIHandler } from '@solidjs/start/server/types';
import { TypedResponse } from './api';

interface Path {
  users: typeof import('../routes/data/users');
  usernames: typeof import('../routes/data/usernames');
  'pack-count': typeof import('../routes/data/pack-count');
  'packs-remaining': typeof import('../routes/data/packs-remaining');
  'site-config': typeof import('../routes/data/site-config');
}

interface ParamPath {
  trades: {
    params: [tradeId: string];
    output: typeof import('../routes/data/trades/[tradeId]');
  };
  user: {
    params: [username: string];
    output: typeof import('../routes/data/user/[username]');
  };
}

type CHECK_PATHS = Expect<Path[keyof Path] extends PathType ? true : false>;
type CHECK_PARAMS = Expect<ParamPath[keyof ParamPath]['output'] extends PathType ? true : false>;
type ExpectedApiGetter = (evt: APIEvent) => Promise<TypedResponse<any>>;
type PathType = {
  GET: ExpectedApiGetter
  load: (...args: any[]) => Promise<any>
};

type Expect<T extends true> = T;

type NoParamPathGetFunction<PathName extends keyof Path> = Path[PathName]['GET'];
type ParamPathGetFunction<PathName extends keyof ParamPath> = ParamPath[PathName]['output']['GET'];

export type PathGetFunction<PathName extends PathKey> = PathName extends keyof Path
  ? NoParamPathGetFunction<PathName>
  : PathName extends keyof ParamPath
  ? ParamPathGetFunction<PathName>
  : never;

type NoParamPathResponse<PathName extends keyof Path> = Awaited<ReturnType<Path[PathName]['GET']>>;
type ParamPathResponse<PathName extends keyof ParamPath> = Awaited<
  ReturnType<ParamPath[PathName]['output']['GET']>
>;

export type PathResponse<PathName extends PathKey> = PathName extends keyof Path
  ? NoParamPathResponse<PathName>
  : PathName extends keyof ParamPath
  ? ParamPathResponse<PathName>
  : never;

type NoParamPathData<PathName extends keyof Path> = NoParamPathResponse<PathName>['data'];
type ParamPathData<PathName extends keyof ParamPath> = ParamPathResponse<PathName>['data'];
export type PathData<PathName extends PathKey> = PathName extends keyof Path
  ? NoParamPathData<PathName>
  : PathName extends keyof ParamPath
  ? ParamPathData<PathName>
  : never;

export type PathKey = keyof Path | keyof ParamPath;

export type Params<PathName extends PathKey> = PathName extends keyof ParamPath
  ? ParamPath[PathName]['params']
  : undefined;

export type DataLoadFunction = typeof DATA_LOAD_GENERIC;

async function DATA_LOAD_GENERIC<PathName extends keyof Path>(
  path: PathName,
  params?: undefined
): Promise<PathData<PathName>>;
async function DATA_LOAD_GENERIC<PathName extends keyof ParamPath>(
  path: PathName,
  params: Params<PathName>
): Promise<PathData<PathName>>;
async function DATA_LOAD_GENERIC<PathName extends PathKey>(
  path: PathName,
  params?: Params<PathName>
): Promise<PathData<PathName>> {
  throw new Error('IMPLEMENTATION MISSING');
  // @ts-expect-error This function should never run
  return;
}
