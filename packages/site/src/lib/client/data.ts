import type { GetDataFn, Params, DataKey } from '../routes.config';

export const get: GetDataFn = async <Path extends DataKey>(
  path: Path,
  params?: Params<Path>
) => {
  const search = new URLSearchParams(params)

  const res = await fetch(`/data/${path}?${search.toString()}`);
  if (!res.ok) {
    console.error(res);
    throw new Error('Res not okay');
  }

  return res.json();
};

