import FAQ from '@/components/FAQ';
import { ASSETS } from '@/constants';
import { client, createData } from '@/data/data.client';

import { transitionname } from '@/lib/client/utils';
// @ts-expect-error -- just calling for typescript
() => void transitionname({}, '');

export default client.defineRoute('/', ['siteConfig'], props => {
  const siteConfig = createData('siteConfig', props);

	return (
		<>
			<h1 class="sr-only">Indigestion Cards</h1>
			<div class="flex flex-col gap-28 overflow-x-hidden">
				<section class="flex min-h-[30rem] flex-row-reverse flex-wrap items-center justify-center justify-items-center gap-4 gap-y-8">
					<div class="-mx-12 -mr-20 flex origin-top justify-center pb-24">
						<img
							use:transitionname="ryan-of-the-wild-hero-card"
							src={ASSETS.CARDS.HERO_CARD_1}
							width="200"
							class="w-52 origin-top-right translate-x-12 translate-y-6 -rotate-12 shadow-xl shadow-black/50 transition-transform duration-500 ease-in-out hover:translate-y-2"
						/>
						<img
							use:transitionname="lilindcult-hero-card"
							src={ASSETS.CARDS.HERO_CARD_2}
							width="200"
							class="w-52 origin-top-left rotate-6 shadow-xl shadow-black/50 transition-transform duration-500 ease-in-out hover:-translate-y-4"
						/>
						<img
							use:transitionname="lilindheart-hero-card"
							src={ASSETS.CARDS.HERO_CARD_3}
							width="200"
							class="w-52 origin-top-left -translate-x-12 translate-y-6 rotate-[18deg] shadow-xl shadow-black/50 transition-transform duration-500 ease-in-out hover:translate-y-2"
						/>
					</div>

					<h2
						class="font-heading w-max text-[2.5rem] font-semibold leading-none text-gray-600 dark:text-gray-300"
						use:transitionname="hero-text-h2">
						<u class="font-bold">Trading</u> cards
						<br />
						for the <s class="">cult</s>
						<span class="text-brand-main text-shadow-brand block font-bold">
							community
						</span>
						{
							// ***uncomment near end of season***
							// *****when there are just over****
							// ********100 packs left***********
							//<RemainingPackCount />
						}
					</h2>
				</section>
				<FAQ content={siteConfig()?.faq ?? ''} />
			</div>
		</>
	);
});
