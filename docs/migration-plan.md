# SST Migration

From the docs:

> Say you have a v2 app in a git repo that’s currently deployed to production. Here’s how we recommend carrying out the migration.

> 1. Use the steps below to migrate over your app to a non-prod stage. You don’t need to import any resources, just recreate them.
> 2. Test your non-prod version of your v3 app.
> 3. Then for your prod stage, follow the steps below and make the import, domain, and subscriber changes.
> 4. Once the prod version of your v3 app is running, clean up some of the v2 prod resources.

https://sst.dev/docs/migrate-from-v2#migration-plan

New production stage name: live

Migration steps:

1. In `infra/config.ts`, update the `importConfig` object with the table and bucket names for imported resources. Ensure no type errors.
2. In `sst.config.ts`, ensure the stage is in the `indiProfileStages` (unless it shouldn't be).
3. In a v2 version of the app (on my PC I have a copy in `../test-repos/indigestion-cards-sst-v2/`) Run `pnpm sst secrets get [SECRET] --stage [STAGE] --profile [PROFILE]` for the following three secrets:
    * TWITCH_CLIENT_SECRET
    * TWITCH_CLIENT_ID
    * AdminImageSecret
4. In the v3 project, run `pnpm sst secret set [SECRET] [VALUE] --stage [STAGE]` using the values from the previous step.
    * Note that v3 doesn't need the profile -- this is handled in the infra source code based on stage name.
5. **Deploy** to correct stage and account.
6. At `dev.twitch.tv`, add the SiteAuth output url to the proper app.
6. In the AWS console, navigate to `API Gateway > Custom domain names` and delete the api and minecraft api domain names (wait about a minute between each domain to avoid being throttled).
7. Navigate to the same v2 version of the app used previously (e.g. `../test-repos/indigestion-cards-sst-v2/`), checkout the branch `v2-no-domains` and run `pnpm sst deploy --stage [STAGE] --profile [PROFILE]`.
8. Update the `readyStages` set to include the stage in question.
9. Deploy again!
