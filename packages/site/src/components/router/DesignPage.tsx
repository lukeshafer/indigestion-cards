import Card from '@/components/cards/Card';
import CardList from '@/components/cards/CardList';
import { trpc } from '@/client/trpc';
import { createQuery } from '@tanstack/solid-query';
import { useParams } from '@solidjs/router';

export default function DesignPage() {
	const params = useParams();
	const design = createQuery(() => ({
		queryKey: ['design', params.designId] as const,
		queryFn: async opts => {
			const [, designId] = opts.queryKey;
			return trpc.cardDesigns.byId.query({ designId });
		},
	}));

	return (

	)
}
