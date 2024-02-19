import type { DataLoadFunction, PathKey, PathData, Params } from '../data.config';

export const get: DataLoadFunction = async <Path extends PathKey>(
  path: Path,
  params?: Params<Path>
) => {
  const pathParams = params ? `/${params.join('/')}` : '';
  const res = await fetch(`/data/${path}${pathParams}`);
  if (!res.ok) {
    console.error(res);
    throw new Error('Res not okay');
  }

  return res.json();
};
