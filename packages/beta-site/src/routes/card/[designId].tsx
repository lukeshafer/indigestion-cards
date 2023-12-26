import Card from '~/components/cards/Card';
import CardList from '~/components/cards/CardList';
import { getCardDesignAndInstancesById } from '@lib/design';
import { getRarityRanking, getSiteConfig } from '@lib/site-config';
import { PageTitle, Heading } from '~/components/text';
import { cache, useParams, type RouteDefinition, createAsync, redirect } from '@solidjs/router';
import { getBaseRarity } from '~/lib/utils';
import { Show } from 'solid-js';

const getDesign = cache(async (designId: string) => {
	const {
		cardDesigns: [design],
		cardInstances: instances,
	} = await getCardDesignAndInstancesById({ designId });
	return { design, instances };
}, 'design');

const getSiteConfigCache = cache(async () => {
	const siteConfig = await getSiteConfig();
	//const rarityRecord = getRarityRanking(siteConfig);
	return { siteConfig };
}, 'siteConfig');

export const route = {
	load: (args) => {
		getDesign(args.params.designId);
	},
} satisfies RouteDefinition;

export default function CardDesign() {
	const params = useParams();
	const designData = createAsync(() => getDesign(params.designId));

	return <Show when={designData()?.design}>{(design) => <p>{design().cardDescription}</p>}</Show>;
}
