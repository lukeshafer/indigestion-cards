# SST Migration

From the docs:

> Say you have a v2 app in a git repo that’s currently deployed to production. Here’s how we recommend carrying out the migration.

> 1. Use the steps below to migrate over your app to a non-prod stage. You don’t need to import any resources, just recreate them.
> 2. Test your non-prod version of your v3 app.
> 3. Then for your prod stage, follow the steps below and make the import, domain, and subscriber changes.
> 4. Once the prod version of your v3 app is running, clean up some of the v2 prod resources.

https://sst.dev/docs/migrate-from-v2#migration-plan

New production stage name: live
