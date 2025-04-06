import { getAllCardDesigns } from '@core/lib/design';
import { publicProcedure } from '../router';

export const designs = {
	getAll: publicProcedure.query(async () => await getAllCardDesigns()),
};
