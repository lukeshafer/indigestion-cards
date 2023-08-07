# Indigestion Cards [![Deploy Production](https://github.com/lukeshafer/twitch-api-project/actions/workflows/deploy-prod.yml/badge.svg)](https://github.com/lukeshafer/twitch-api-project/actions/workflows/deploy-prod.yml) [![Deploy Staging on update main](https://github.com/lukeshafer/twitch-api-project/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/lukeshafer/twitch-api-project/actions/workflows/deploy-staging.yml) [![Deploy Dev and QA](https://github.com/lukeshafer/twitch-api-project/actions/workflows/deploy-dev.yml/badge.svg)](https://github.com/lukeshafer/twitch-api-project/actions/workflows/deploy-dev.yml)

_Indigestion Cards_ is a project from **lil indigestion**, a creator name Ryan who makes blind playthroughs of games on Youtube and Twitch! A full FAQ for the project is available at [indigestioncards.com](https://indigestioncards.com).

## Editing the FAQ (for Ryan)

[Click here to edit the FAQ](https://github.com/lukeshafer/twitch-api-project/edit/main/packages/site/src/content/faq.md), or navigate to `packages/site/src/content/faq.md` to edit manually.

## Project tech

The project is primarily written in TypeScript and syntaxes based on it, like JSX and Astro.

### Database and Server Hosting

Indigestion cards is built on [SST](https://sst.dev), a framework for building serverless applications on AWS. I chose SST because it makes developing for AWS relatively painless, letting us host the full application at _very_ low costs. It also gives us access to any AWS service, so we have not needed to reach outsite AWS for anything at this time.

All TypeScript code for the site runs on **AWS Lambda**. We use **DynamoDB** for the database, and various event-based services for the Twitch integration.

### Website

The website is built using [Astro](https://astro.build), a web framework for building server-rendered websites using JavaScript. Astro's focus on server-generated, content-based sites made it a natural fit for this project. Astro also provides integrations for a few libraries we use, like [SolidJS](https://solidjs.com) for client-side interaction and [TailwindCSS](https://tailwindcss.com) for styling with CSS.
