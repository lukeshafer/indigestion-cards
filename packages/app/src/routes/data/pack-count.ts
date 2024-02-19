import { TypedResponse, createLoader } from '@/lib/api';
import { getAllPacks } from '@lib/pack';
import { APIHandler } from '@solidjs/start/server/types';

export const { GET, load } = createLoader(async () => {
  const packs = await getAllPacks();
  const packCount = packs.length;

  return new TypedResponse({ packCount });
});
