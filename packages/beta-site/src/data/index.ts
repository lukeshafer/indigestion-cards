import { getAllCardDesigns } from '@core/lib/design';
import { cache } from '@solidjs/router';

export const loadAllCardDesigns = cache(() => {
	'use server';
	return getAllCardDesigns();
}, 'carddesigns');
