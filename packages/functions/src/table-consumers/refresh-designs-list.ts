import { refreshAllDesignsPageData } from "@core/lib/design"

export const handler = async () => {
	console.log('refreshing designs page');
  await refreshAllDesignsPageData()
}
