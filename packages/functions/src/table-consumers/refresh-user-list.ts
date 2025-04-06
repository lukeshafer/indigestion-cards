import { refreshAllUsersPageData } from '@core/lib/user';

export const handler = async () => {
	console.log('refreshing users page');
  await refreshAllUsersPageData()
};
