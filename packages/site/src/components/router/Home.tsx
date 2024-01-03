import { ASSETS } from '@/constants';
import { trpc } from '@/client/trpc';
import { createQuery } from '@tanstack/solid-query';
import RemainingPackCount from '../RemainingPackCount';
import FAQ from '../FAQ';

export default function Home() {
  const siteConfig = createQuery(() => ({
    queryFn: () => trpc.siteConfig.query(),
    queryKey: ['site-config'],
  }));

  return (
    <>
      <h1 class="sr-only">Indigestion Cards</h1>
      <div class="flex flex-col gap-8 overflow-x-hidden">
        <section class="flex min-h-[30rem] flex-row-reverse flex-wrap items-center justify-center justify-items-center gap-4 gap-y-8">
          <div class="-mx-12 -mr-20 flex origin-top justify-center pb-24">
            <img
              style={{ 'view-transition-name': 'ryan-of-the-wild-hero-card' }}
              src={ASSETS.CARDS.HERO_CARD_1}
              width="200"
              class="w-52 origin-top-right translate-x-12 translate-y-6 -rotate-12 shadow-xl shadow-black/50 transition-transform duration-500 ease-in-out hover:translate-y-2"
            />
            <img
              style={{ 'view-transition-name': 'lilindcult-hero-card' }}
              src={ASSETS.CARDS.HERO_CARD_2}
              width="200"
              class="w-52 origin-top-left rotate-6 shadow-xl shadow-black/50 transition-transform duration-500 ease-in-out hover:-translate-y-4"
            />
            <img
              style={{ 'view-transition-name': 'lilindheart-hero-card' }}
              src={ASSETS.CARDS.HERO_CARD_3}
              width="200"
              class="w-52 origin-top-left -translate-x-12 translate-y-6 rotate-[18deg] shadow-xl shadow-black/50 transition-transform duration-500 ease-in-out hover:translate-y-2"
            />
          </div>
          {siteConfig.data?.tradingIsEnabled ? (
            <h2
              class="font-heading w-max text-[2.5rem] font-semibold leading-none text-gray-600 dark:text-gray-300"
              style={{ 'view-transition-name': 'hero-text-h2' }}>
              <u class="font-bold">Trading</u> cards
              <br />
              for the <s class="">cult</s>
              <span class="text-brand-main text-shadow-brand block font-bold">
                community
              </span>
              <RemainingPackCount />
            </h2>
          ) : (
            <h2
              class="font-heading w-max text-[2.5rem] font-semibold leading-none text-gray-600 dark:text-gray-300"
              style={{ 'view-transition-name': 'hero-text-h2' }}>
              Trading<sup class="">*</sup> cards
              <br />
              for the{' '}
              <s class="font-bold">cult</s>
              <span class="text-brand-main text-shadow block font-bold">
                community
              </span>
              <p class="py-8 text-xs">* Cards not yet tradeable.</p>
              <RemainingPackCount />
            </h2>
          )}
        </section>
        <article class="prose prose-h2:uppercase prose-h2:text-center prose-h2:text-gray-600 dark:prose-h2:text-gray-300 prose-h2:font-bold prose-h2:text-3xl prose-h3:font-heading prose-h3:text-2xl prose-h3:font-semibold prose-h3:text-gray-700 dark:prose-h3:text-gray-200 dark:prose-strong:text-white dark:prose-strong:font-bold prose-a:text-blue-900 dark:prose-a:text-blue-100 mx-auto max-w-3xl text-lg text-gray-900 dark:text-gray-100">
          <FAQ />
        </article>
      </div>
    </>
  );
}
