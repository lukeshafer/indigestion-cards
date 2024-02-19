import { TypedResponse, createLoader } from '@/lib/api';
import { getSiteConfig } from '@lil-indigestion-cards/core/lib/site-config';
import type { APIHandler } from '@solidjs/start/server/types';

export const { GET, load } = createLoader(async () => {
	const siteConfig = await getSiteConfig();
  return siteConfig
}) 
