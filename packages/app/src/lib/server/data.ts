import {  } from '@solidjs/start'
import type { DataLoadFunction, PathKey, PathGetFunction, Params } from '../data.config';

export const load: DataLoadFunction = async <Path extends PathKey>(
  path: Path,
  params?: Params<Path>
) => {
  const result = (await import(path)).GET as PathGetFunction<Path>

  //result({params:{} })

};
