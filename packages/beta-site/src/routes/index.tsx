import { ASSETS } from '@site/constants';
import type { ParentComponent } from 'solid-js';

export default function Home() {
	return (
		<main class="">
			<HomepageHero></HomepageHero>
		</main>
	);
}

const HomepageHero: ParentComponent = () => (
	<section class="flex min-h-[30rem] flex-row-reverse flex-wrap items-center justify-center justify-items-center gap-4 gap-y-8">
		<div class="-mx-12 -mr-20 flex origin-top justify-center pb-24">
			<img
				src={ASSETS.CARDS.HERO_CARD_1}
				alt=""
				width="200"
				style={{ 'view-transition-name': 'ryan-of-the-wild-hero-card' }}
				class="w-52 origin-top-right translate-x-12 translate-y-6 -rotate-12 shadow-xl shadow-black/50 transition-transform duration-500 ease-in-out hover:translate-y-2"
			/>
			<img
				style={{ 'view-transition-name': 'lilindcult-hero-card' }}
				src={ASSETS.CARDS.HERO_CARD_2}
				alt=""
				width="200"
				class="w-52 origin-top-left rotate-6 shadow-xl shadow-black/50 transition-transform duration-500 ease-in-out hover:-translate-y-4"
			/>
			<img
				style={{ 'view-transition-name': 'lilindheart-hero-card' }}
				src={ASSETS.CARDS.HERO_CARD_3}
				alt=""
				width="200"
				class="w-52 origin-top-left -translate-x-12 translate-y-6 rotate-[18deg] shadow-xl shadow-black/50 transition-transform duration-500 ease-in-out hover:translate-y-2"
			/>
		</div>
		<h2
			class="font-heading w-max text-[2.5rem] font-semibold leading-none text-gray-600 dark:text-gray-300"
			style={{ 'view-transition-name': 'hero-text-h2' }}>
			Trading cards <br /> for the <s class="">cult</s>
			<span class="text-brand-500 dark:text-brand-300 text-shadow-brand block font-bold">
				community
			</span>
		</h2>
	</section>
);
