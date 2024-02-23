import { ASSETS } from "@/constants";

export default function Status404() {
  return (
    <>
      <h1 class="text-7xl font-display italic text-red-500 my-5">404</h1>
      <img
        src={ASSETS.EMOTES.LILINDOHNO}
        width="100"
        alt="Ryan shaking his head in panic"
        class="OHNO text-4xl text-center font-mono w-40 h-40"
      />
      <p class="my-2 text-3xl font-display italic text-brand-secondary">OH NO</p>
      <p class="mt-12 text-center text-3xl font-mono">The page you're looking for doesn't exist!!</p>
    </>
  )
}
