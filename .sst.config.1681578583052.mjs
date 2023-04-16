import { createRequire as topLevelCreateRequire } from 'module';const require = topLevelCreateRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// stacks/config.ts
import { Config } from "sst/constructs";
function ConfigStack({ stack }) {
  const secrets = Config.Secret.create(
    stack,
    "TWITCH_CLIENT_ID",
    "TWITCH_CLIENT_SECRET",
    "TWITCH_ACCESS_TOKEN"
  );
  return secrets;
}
__name(ConfigStack, "ConfigStack");

// stacks/api.ts
import { Api, use as use4 } from "sst/constructs";

// stacks/database.ts
import { Table } from "sst/constructs";
function Database({ stack }) {
  const table = new Table(stack, "data", {
    fields: {
      pk: "string",
      sk: "string",
      gsi1pk: "string",
      gsi1sk: "string",
      gsi2pk: "string",
      gsi2sk: "string",
      gsi3pk: "string",
      gsi3sk: "string"
    },
    primaryIndex: {
      partitionKey: "pk",
      sortKey: "sk"
    },
    globalIndexes: {
      gsi1: {
        partitionKey: "gsi1pk",
        sortKey: "gsi1sk"
      },
      gsi2: {
        partitionKey: "gsi2pk",
        sortKey: "gsi2sk"
      },
      gsi3: {
        partitionKey: "gsi3pk",
        sortKey: "gsi3sk"
      }
    }
  });
  return table;
}
__name(Database, "Database");

// stacks/events.ts
import { EventBus, Queue, use } from "sst/constructs";
function Events({ stack }) {
  const table = use(Database);
  const queue = new Queue(stack, "queue", {
    consumer: {
      function: {
        bind: [table],
        handler: "packages/functions/src/give-pack-to-user.handler"
      },
      cdk: {
        eventSource: {
          batchSize: 1
        }
      }
    }
  });
  const eventBus = new EventBus(stack, "eventBus", {
    rules: {
      "give-pack-to-user": {
        pattern: {
          source: ["twitch"],
          detailType: ["give-pack-to-user"]
        },
        targets: {
          queue
        }
      }
    },
    defaults: {
      function: {
        bind: [table]
      }
    }
  });
  return eventBus;
}
__name(Events, "Events");

// stacks/bucket.ts
import { Bucket, use as use2 } from "sst/constructs";
function DesignBucket({ stack }) {
  const db = use2(Database);
  const cardDesignBucket = new Bucket(stack, "CardDesigns", {
    notifications: {
      fileUploaded: {
        function: "packages/functions/src/handle-image-upload.handler"
      }
    },
    defaults: {
      function: {
        bind: [db]
      }
    }
  });
  const frameBucket = new Bucket(stack, "FrameDesigns", {
    notifications: {
      fileUploaded: {
        function: "packages/functions/src/handle-frame-upload.handler"
      }
    },
    defaults: {
      function: {
        bind: [db]
      }
    }
  });
  return { cardDesignBucket, frameBucket };
}
__name(DesignBucket, "DesignBucket");

// stacks/auth.ts
import { use as use3 } from "sst/constructs";
import { Auth as SSTAuth } from "sst/constructs/future";
function Auth({ stack }) {
  const secrets = use3(ConfigStack);
  const db = use3(Database);
  const auth = new SSTAuth(stack, "AdminSiteAuth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
      bind: [secrets.TWITCH_CLIENT_ID, secrets.TWITCH_CLIENT_SECRET, db]
    }
  });
  stack.addOutputs({
    authEndpoint: auth.url
  });
  return auth;
}
__name(Auth, "Auth");

// stacks/api.ts
function API({ stack }) {
  const table = use4(Database);
  const eventBus = use4(Events);
  const { frameBucket, cardDesignBucket } = use4(DesignBucket);
  const secrets = use4(ConfigStack);
  const auth = use4(Auth);
  const api = new Api(stack, "api", {
    routes: {
      "GET /": "packages/functions/src/twitch-api.handler",
      "POST /": "packages/functions/src/twitch-api.handler",
      "POST /give-pack-to-user": "packages/functions/src/invoke-give-pack-event.handler",
      "POST /create-card-season": "packages/functions/src/create-card-season.handler",
      "POST /create-card-design": "packages/functions/src/create-card-design.handler",
      "POST /create-rarity": "packages/functions/src/create-rarity.handler",
      "POST /delete-card-design/{seasonId}/{designId}": "packages/functions/src/delete-card-design.handler",
      "POST /delete-card-season/{id}": "packages/functions/src/delete-card-season.handler",
      "POST /delete-unmatched-image/{id}": "packages/functions/src/delete-unmatched-image.handler",
      "POST /delete-rarity/{id}": "packages/functions/src/delete-rarity.handler",
      "POST /create-admin-user": "packages/functions/src/create-admin-user.handler"
    },
    defaults: {
      function: {
        bind: [
          secrets.TWITCH_CLIENT_ID,
          secrets.TWITCH_CLIENT_SECRET,
          secrets.TWITCH_ACCESS_TOKEN,
          table,
          eventBus,
          frameBucket,
          cardDesignBucket,
          auth
        ]
      }
    }
  });
  stack.addOutputs({
    ApiEndpoint: api.url
  });
  return api;
}
__name(API, "API");

// stacks/sites.ts
import { AstroSite, use as use5 } from "sst/constructs";
function Sites({ stack }) {
  const table = use5(Database);
  const api = use5(API);
  const { frameBucket, cardDesignBucket } = use5(DesignBucket);
  const auth = use5(Auth);
  const adminSite = new AstroSite(stack, "admin", {
    path: "packages/admin-site",
    bind: [table, api, frameBucket, cardDesignBucket, auth]
  });
  stack.addOutputs({
    AdminUrl: adminSite.url
  });
}
__name(Sites, "Sites");

// sst.config.ts
var sst_config_default = {
  config(_input) {
    return {
      name: "lil-indigestion-cards",
      region: "us-east-2"
    };
  },
  stacks(app) {
    app.stack(ConfigStack).stack(Database).stack(Auth).stack(Events).stack(DesignBucket).stack(API).stack(Sites);
  }
};
export {
  sst_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3RhY2tzL2NvbmZpZy50cyIsICJzdGFja3MvYXBpLnRzIiwgInN0YWNrcy9kYXRhYmFzZS50cyIsICJzdGFja3MvZXZlbnRzLnRzIiwgInN0YWNrcy9idWNrZXQudHMiLCAic3RhY2tzL2F1dGgudHMiLCAic3RhY2tzL3NpdGVzLnRzIiwgInNzdC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgU3RhY2tDb250ZXh0IH0gZnJvbSAnc3N0L2NvbnN0cnVjdHMnXG5pbXBvcnQgeyBDb25maWcgfSBmcm9tICdzc3QvY29uc3RydWN0cydcblxuZXhwb3J0IGZ1bmN0aW9uIENvbmZpZ1N0YWNrKHsgc3RhY2sgfTogU3RhY2tDb250ZXh0KSB7XG5cdGNvbnN0IHNlY3JldHMgPSBDb25maWcuU2VjcmV0LmNyZWF0ZShcblx0XHRzdGFjayxcblx0XHQnVFdJVENIX0NMSUVOVF9JRCcsXG5cdFx0J1RXSVRDSF9DTElFTlRfU0VDUkVUJyxcblx0XHQnVFdJVENIX0FDQ0VTU19UT0tFTidcblx0KVxuXG5cdHJldHVybiBzZWNyZXRzXG59XG4iLCAiaW1wb3J0IHsgU3RhY2tDb250ZXh0LCBBcGksIHVzZSB9IGZyb20gJ3NzdC9jb25zdHJ1Y3RzJ1xuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tICcuL2RhdGFiYXNlJ1xuaW1wb3J0IHsgRXZlbnRzIH0gZnJvbSAnLi9ldmVudHMnXG5pbXBvcnQgeyBEZXNpZ25CdWNrZXQgfSBmcm9tICcuL2J1Y2tldCdcbmltcG9ydCB7IENvbmZpZ1N0YWNrIH0gZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgeyBBdXRoIH0gZnJvbSAnLi9hdXRoJ1xuXG5leHBvcnQgZnVuY3Rpb24gQVBJKHsgc3RhY2sgfTogU3RhY2tDb250ZXh0KSB7XG5cdGNvbnN0IHRhYmxlID0gdXNlKERhdGFiYXNlKVxuXHRjb25zdCBldmVudEJ1cyA9IHVzZShFdmVudHMpXG5cdGNvbnN0IHsgZnJhbWVCdWNrZXQsIGNhcmREZXNpZ25CdWNrZXQgfSA9IHVzZShEZXNpZ25CdWNrZXQpXG5cdGNvbnN0IHNlY3JldHMgPSB1c2UoQ29uZmlnU3RhY2spXG5cdGNvbnN0IGF1dGggPSB1c2UoQXV0aClcblxuXHRjb25zdCBhcGkgPSBuZXcgQXBpKHN0YWNrLCAnYXBpJywge1xuXHRcdHJvdXRlczoge1xuXHRcdFx0J0dFVCAvJzogJ3BhY2thZ2VzL2Z1bmN0aW9ucy9zcmMvdHdpdGNoLWFwaS5oYW5kbGVyJyxcblx0XHRcdCdQT1NUIC8nOiAncGFja2FnZXMvZnVuY3Rpb25zL3NyYy90d2l0Y2gtYXBpLmhhbmRsZXInLFxuXHRcdFx0J1BPU1QgL2dpdmUtcGFjay10by11c2VyJzogJ3BhY2thZ2VzL2Z1bmN0aW9ucy9zcmMvaW52b2tlLWdpdmUtcGFjay1ldmVudC5oYW5kbGVyJyxcblx0XHRcdCdQT1NUIC9jcmVhdGUtY2FyZC1zZWFzb24nOiAncGFja2FnZXMvZnVuY3Rpb25zL3NyYy9jcmVhdGUtY2FyZC1zZWFzb24uaGFuZGxlcicsXG5cdFx0XHQnUE9TVCAvY3JlYXRlLWNhcmQtZGVzaWduJzogJ3BhY2thZ2VzL2Z1bmN0aW9ucy9zcmMvY3JlYXRlLWNhcmQtZGVzaWduLmhhbmRsZXInLFxuXHRcdFx0J1BPU1QgL2NyZWF0ZS1yYXJpdHknOiAncGFja2FnZXMvZnVuY3Rpb25zL3NyYy9jcmVhdGUtcmFyaXR5LmhhbmRsZXInLFxuXHRcdFx0J1BPU1QgL2RlbGV0ZS1jYXJkLWRlc2lnbi97c2Vhc29uSWR9L3tkZXNpZ25JZH0nOlxuXHRcdFx0XHQncGFja2FnZXMvZnVuY3Rpb25zL3NyYy9kZWxldGUtY2FyZC1kZXNpZ24uaGFuZGxlcicsXG5cdFx0XHQnUE9TVCAvZGVsZXRlLWNhcmQtc2Vhc29uL3tpZH0nOiAncGFja2FnZXMvZnVuY3Rpb25zL3NyYy9kZWxldGUtY2FyZC1zZWFzb24uaGFuZGxlcicsXG5cdFx0XHQnUE9TVCAvZGVsZXRlLXVubWF0Y2hlZC1pbWFnZS97aWR9JzogJ3BhY2thZ2VzL2Z1bmN0aW9ucy9zcmMvZGVsZXRlLXVubWF0Y2hlZC1pbWFnZS5oYW5kbGVyJyxcblx0XHRcdCdQT1NUIC9kZWxldGUtcmFyaXR5L3tpZH0nOiAncGFja2FnZXMvZnVuY3Rpb25zL3NyYy9kZWxldGUtcmFyaXR5LmhhbmRsZXInLFxuXHRcdFx0J1BPU1QgL2NyZWF0ZS1hZG1pbi11c2VyJzogJ3BhY2thZ2VzL2Z1bmN0aW9ucy9zcmMvY3JlYXRlLWFkbWluLXVzZXIuaGFuZGxlcicsXG5cdFx0fSxcblx0XHRkZWZhdWx0czoge1xuXHRcdFx0ZnVuY3Rpb246IHtcblx0XHRcdFx0YmluZDogW1xuXHRcdFx0XHRcdHNlY3JldHMuVFdJVENIX0NMSUVOVF9JRCxcblx0XHRcdFx0XHRzZWNyZXRzLlRXSVRDSF9DTElFTlRfU0VDUkVULFxuXHRcdFx0XHRcdHNlY3JldHMuVFdJVENIX0FDQ0VTU19UT0tFTixcblx0XHRcdFx0XHR0YWJsZSxcblx0XHRcdFx0XHRldmVudEJ1cyxcblx0XHRcdFx0XHRmcmFtZUJ1Y2tldCxcblx0XHRcdFx0XHRjYXJkRGVzaWduQnVja2V0LFxuXHRcdFx0XHRcdGF1dGgsXG5cdFx0XHRcdF0sXG5cdFx0XHR9LFxuXHRcdH0sXG5cdH0pXG5cblx0c3RhY2suYWRkT3V0cHV0cyh7XG5cdFx0QXBpRW5kcG9pbnQ6IGFwaS51cmwsXG5cdH0pXG5cblx0cmV0dXJuIGFwaVxufVxuIiwgImltcG9ydCB7IFN0YWNrQ29udGV4dCwgVGFibGUgfSBmcm9tICdzc3QvY29uc3RydWN0cydcblxuZXhwb3J0IGZ1bmN0aW9uIERhdGFiYXNlKHsgc3RhY2sgfTogU3RhY2tDb250ZXh0KSB7XG5cdGNvbnN0IHRhYmxlID0gbmV3IFRhYmxlKHN0YWNrLCAnZGF0YScsIHtcblx0XHRmaWVsZHM6IHtcblx0XHRcdHBrOiAnc3RyaW5nJyxcblx0XHRcdHNrOiAnc3RyaW5nJyxcblx0XHRcdGdzaTFwazogJ3N0cmluZycsXG5cdFx0XHRnc2kxc2s6ICdzdHJpbmcnLFxuXHRcdFx0Z3NpMnBrOiAnc3RyaW5nJyxcblx0XHRcdGdzaTJzazogJ3N0cmluZycsXG5cdFx0XHRnc2kzcGs6ICdzdHJpbmcnLFxuXHRcdFx0Z3NpM3NrOiAnc3RyaW5nJyxcblx0XHR9LFxuXHRcdHByaW1hcnlJbmRleDoge1xuXHRcdFx0cGFydGl0aW9uS2V5OiAncGsnLFxuXHRcdFx0c29ydEtleTogJ3NrJyxcblx0XHR9LFxuXHRcdGdsb2JhbEluZGV4ZXM6IHtcblx0XHRcdGdzaTE6IHtcblx0XHRcdFx0cGFydGl0aW9uS2V5OiAnZ3NpMXBrJyxcblx0XHRcdFx0c29ydEtleTogJ2dzaTFzaycsXG5cdFx0XHR9LFxuXHRcdFx0Z3NpMjoge1xuXHRcdFx0XHRwYXJ0aXRpb25LZXk6ICdnc2kycGsnLFxuXHRcdFx0XHRzb3J0S2V5OiAnZ3NpMnNrJyxcblx0XHRcdH0sXG5cdFx0XHRnc2kzOiB7XG5cdFx0XHRcdHBhcnRpdGlvbktleTogJ2dzaTNwaycsXG5cdFx0XHRcdHNvcnRLZXk6ICdnc2kzc2snLFxuXHRcdFx0fSxcblx0XHR9LFxuXHR9KVxuXG5cdC8vIFRPRE86IGFkZCBjcm9uIGpvYiB0byBjaGVjayB0d2l0Y2ggZm9yIHVzZXJzIHdobyBoYXZlIHVwZGF0ZWQgdGhlaXIgdXNlcm5hbWVcblxuXHRyZXR1cm4gdGFibGVcbn1cbiIsICJpbXBvcnQgeyBTdGFja0NvbnRleHQsIEV2ZW50QnVzLCBRdWV1ZSwgdXNlIH0gZnJvbSAnc3N0L2NvbnN0cnVjdHMnXG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gJy4vZGF0YWJhc2UnXG5cbmV4cG9ydCBmdW5jdGlvbiBFdmVudHMoeyBzdGFjayB9OiBTdGFja0NvbnRleHQpIHtcblx0Y29uc3QgdGFibGUgPSB1c2UoRGF0YWJhc2UpXG5cblx0Y29uc3QgcXVldWUgPSBuZXcgUXVldWUoc3RhY2ssICdxdWV1ZScsIHtcblx0XHRjb25zdW1lcjoge1xuXHRcdFx0ZnVuY3Rpb246IHtcblx0XHRcdFx0YmluZDogW3RhYmxlXSxcblx0XHRcdFx0aGFuZGxlcjogJ3BhY2thZ2VzL2Z1bmN0aW9ucy9zcmMvZ2l2ZS1wYWNrLXRvLXVzZXIuaGFuZGxlcicsXG5cdFx0XHR9LFxuXHRcdFx0Y2RrOiB7XG5cdFx0XHRcdGV2ZW50U291cmNlOiB7XG5cdFx0XHRcdFx0YmF0Y2hTaXplOiAxLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHR9LFxuXHR9KVxuXG5cdGNvbnN0IGV2ZW50QnVzID0gbmV3IEV2ZW50QnVzKHN0YWNrLCAnZXZlbnRCdXMnLCB7XG5cdFx0cnVsZXM6IHtcblx0XHRcdCdnaXZlLXBhY2stdG8tdXNlcic6IHtcblx0XHRcdFx0cGF0dGVybjoge1xuXHRcdFx0XHRcdHNvdXJjZTogWyd0d2l0Y2gnXSxcblx0XHRcdFx0XHRkZXRhaWxUeXBlOiBbJ2dpdmUtcGFjay10by11c2VyJ10sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRhcmdldHM6IHtcblx0XHRcdFx0XHRxdWV1ZSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0fSxcblx0XHRkZWZhdWx0czoge1xuXHRcdFx0ZnVuY3Rpb246IHtcblx0XHRcdFx0YmluZDogW3RhYmxlXSxcblx0XHRcdH0sXG5cdFx0fSxcblx0fSlcblxuXHRyZXR1cm4gZXZlbnRCdXNcbn1cbiIsICJpbXBvcnQgeyBTdGFja0NvbnRleHQsIEJ1Y2tldCwgdXNlIH0gZnJvbSAnc3N0L2NvbnN0cnVjdHMnXG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gJy4vZGF0YWJhc2UnXG5cbmV4cG9ydCBmdW5jdGlvbiBEZXNpZ25CdWNrZXQoeyBzdGFjayB9OiBTdGFja0NvbnRleHQpIHtcblx0Y29uc3QgZGIgPSB1c2UoRGF0YWJhc2UpXG5cblx0Y29uc3QgY2FyZERlc2lnbkJ1Y2tldCA9IG5ldyBCdWNrZXQoc3RhY2ssICdDYXJkRGVzaWducycsIHtcblx0XHRub3RpZmljYXRpb25zOiB7XG5cdFx0XHRmaWxlVXBsb2FkZWQ6IHtcblx0XHRcdFx0ZnVuY3Rpb246ICdwYWNrYWdlcy9mdW5jdGlvbnMvc3JjL2hhbmRsZS1pbWFnZS11cGxvYWQuaGFuZGxlcicsXG5cdFx0XHR9LFxuXHRcdH0sXG5cdFx0ZGVmYXVsdHM6IHtcblx0XHRcdGZ1bmN0aW9uOiB7XG5cdFx0XHRcdGJpbmQ6IFtkYl0sXG5cdFx0XHR9LFxuXHRcdH0sXG5cdH0pXG5cblx0Y29uc3QgZnJhbWVCdWNrZXQgPSBuZXcgQnVja2V0KHN0YWNrLCAnRnJhbWVEZXNpZ25zJywge1xuXHRcdG5vdGlmaWNhdGlvbnM6IHtcblx0XHRcdGZpbGVVcGxvYWRlZDoge1xuXHRcdFx0XHRmdW5jdGlvbjogJ3BhY2thZ2VzL2Z1bmN0aW9ucy9zcmMvaGFuZGxlLWZyYW1lLXVwbG9hZC5oYW5kbGVyJyxcblx0XHRcdH0sXG5cdFx0fSxcblx0XHRkZWZhdWx0czoge1xuXHRcdFx0ZnVuY3Rpb246IHtcblx0XHRcdFx0YmluZDogW2RiXSxcblx0XHRcdH0sXG5cdFx0fSxcblx0fSlcblxuXHRyZXR1cm4geyBjYXJkRGVzaWduQnVja2V0LCBmcmFtZUJ1Y2tldCB9XG59XG4iLCAiaW1wb3J0IHsgdHlwZSBTdGFja0NvbnRleHQsIHVzZSB9IGZyb20gJ3NzdC9jb25zdHJ1Y3RzJ1xuaW1wb3J0IHsgQXV0aCBhcyBTU1RBdXRoIH0gZnJvbSAnc3N0L2NvbnN0cnVjdHMvZnV0dXJlJ1xuaW1wb3J0IHsgQ29uZmlnU3RhY2sgfSBmcm9tICcuL2NvbmZpZydcbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSAnLi9kYXRhYmFzZSdcblxuZXhwb3J0IGZ1bmN0aW9uIEF1dGgoeyBzdGFjayB9OiBTdGFja0NvbnRleHQpIHtcblx0Y29uc3Qgc2VjcmV0cyA9IHVzZShDb25maWdTdGFjaylcblx0Y29uc3QgZGIgPSB1c2UoRGF0YWJhc2UpXG5cblx0Y29uc3QgYXV0aCA9IG5ldyBTU1RBdXRoKHN0YWNrLCAnQWRtaW5TaXRlQXV0aCcsIHtcblx0XHRhdXRoZW50aWNhdG9yOiB7XG5cdFx0XHRoYW5kbGVyOiAncGFja2FnZXMvZnVuY3Rpb25zL3NyYy9hdXRoLmhhbmRsZXInLFxuXHRcdFx0YmluZDogW3NlY3JldHMuVFdJVENIX0NMSUVOVF9JRCwgc2VjcmV0cy5UV0lUQ0hfQ0xJRU5UX1NFQ1JFVCwgZGJdLFxuXHRcdH0sXG5cdH0pXG5cblx0c3RhY2suYWRkT3V0cHV0cyh7XG5cdFx0YXV0aEVuZHBvaW50OiBhdXRoLnVybCxcblx0fSlcblxuXHRyZXR1cm4gYXV0aFxufVxuIiwgImltcG9ydCB7IFN0YWNrQ29udGV4dCwgQXN0cm9TaXRlLCB1c2UgfSBmcm9tICdzc3QvY29uc3RydWN0cydcbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSAnLi9kYXRhYmFzZSdcbmltcG9ydCB7IEFQSSB9IGZyb20gJy4vYXBpJ1xuaW1wb3J0IHsgRGVzaWduQnVja2V0IH0gZnJvbSAnLi9idWNrZXQnXG5pbXBvcnQgeyBBdXRoIH0gZnJvbSAnLi9hdXRoJ1xuXG5leHBvcnQgZnVuY3Rpb24gU2l0ZXMoeyBzdGFjayB9OiBTdGFja0NvbnRleHQpIHtcblx0Y29uc3QgdGFibGUgPSB1c2UoRGF0YWJhc2UpXG5cdGNvbnN0IGFwaSA9IHVzZShBUEkpXG5cdGNvbnN0IHsgZnJhbWVCdWNrZXQsIGNhcmREZXNpZ25CdWNrZXQgfSA9IHVzZShEZXNpZ25CdWNrZXQpXG5cdGNvbnN0IGF1dGggPSB1c2UoQXV0aClcblxuXHRjb25zdCBhZG1pblNpdGUgPSBuZXcgQXN0cm9TaXRlKHN0YWNrLCAnYWRtaW4nLCB7XG5cdFx0cGF0aDogJ3BhY2thZ2VzL2FkbWluLXNpdGUnLFxuXHRcdGJpbmQ6IFt0YWJsZSwgYXBpLCBmcmFtZUJ1Y2tldCwgY2FyZERlc2lnbkJ1Y2tldCwgYXV0aF0sXG5cdH0pXG5cblx0Ly8gVE9ETzogYWRkIGNyb24gam9iIHRvIGNoZWNrIHR3aXRjaCBmb3IgdXNlcnMgd2hvIGhhdmUgdXBkYXRlZCB0aGVpciB1c2VybmFtZVxuXG5cdHN0YWNrLmFkZE91dHB1dHMoe1xuXHRcdEFkbWluVXJsOiBhZG1pblNpdGUudXJsLFxuXHR9KVxufVxuIiwgImltcG9ydCB7IFNTVENvbmZpZyB9IGZyb20gJ3NzdCdcbmltcG9ydCB7IENvbmZpZ1N0YWNrIH0gZnJvbSAnLi9zdGFja3MvY29uZmlnJ1xuaW1wb3J0IHsgQVBJIH0gZnJvbSAnLi9zdGFja3MvYXBpJ1xuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tICcuL3N0YWNrcy9kYXRhYmFzZSdcbmltcG9ydCB7IEV2ZW50cyB9IGZyb20gJy4vc3RhY2tzL2V2ZW50cydcbmltcG9ydCB7IFNpdGVzIH0gZnJvbSAnLi9zdGFja3Mvc2l0ZXMnXG5pbXBvcnQgeyBEZXNpZ25CdWNrZXQgfSBmcm9tICcuL3N0YWNrcy9idWNrZXQnXG5pbXBvcnQgeyBBdXRoIH0gZnJvbSAnLi9zdGFja3MvYXV0aCdcblxuZXhwb3J0IGRlZmF1bHQge1xuXHRjb25maWcoX2lucHV0KSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG5hbWU6ICdsaWwtaW5kaWdlc3Rpb24tY2FyZHMnLFxuXHRcdFx0cmVnaW9uOiAndXMtZWFzdC0yJyxcblx0XHR9XG5cdH0sXG5cdHN0YWNrcyhhcHApIHtcblx0XHRhcHBcblx0XHRcdC5zdGFjayhDb25maWdTdGFjaylcblx0XHRcdC5zdGFjayhEYXRhYmFzZSlcblx0XHRcdC5zdGFjayhBdXRoKVxuXHRcdFx0LnN0YWNrKEV2ZW50cylcblx0XHRcdC5zdGFjayhEZXNpZ25CdWNrZXQpXG5cdFx0XHQuc3RhY2soQVBJKVxuXHRcdFx0LnN0YWNrKFNpdGVzKVxuXHR9LFxufSBzYXRpc2ZpZXMgU1NUQ29uZmlnXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7OztBQUNBLFNBQVMsY0FBYztBQUVoQixTQUFTLFlBQVksRUFBRSxNQUFNLEdBQWlCO0FBQ3BELFFBQU0sVUFBVSxPQUFPLE9BQU87QUFBQSxJQUM3QjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Q7QUFFQSxTQUFPO0FBQ1I7QUFUZ0I7OztBQ0hoQixTQUF1QixLQUFLLE9BQUFBLFlBQVc7OztBQ0F2QyxTQUF1QixhQUFhO0FBRTdCLFNBQVMsU0FBUyxFQUFFLE1BQU0sR0FBaUI7QUFDakQsUUFBTSxRQUFRLElB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LFFBQVE7QUFDMUIsUUFBTSxNQUFNQSxLQUFJLEdBQUc7QUFDbkIsUUFBTSxFQUFFLGFBQWEsaUJBQWlCLElBQUlBLEtBQUksWUFBWTtBQUMxRCxRQUFNLE9BQU9BLEtBQUksSUFBSTtBQUVyQixRQUFNLFlBQVksSUFBSSxVQUFVLE9BQU8sU0FBUztBQUFBLElBQy9DLE1BQU07QUFBQSxJQUNOLE1BQU0sQ0FBQyxPQUFPLEtBQUssYUFBYSxrQkFBa0IsSUFBSTtBQUFBLEVBQ3ZELENBQUM7QUFJRCxRQUFNLFdBQVc7QUFBQSxJQUNoQixVQUFVLFVBQVU7QUFBQSxFQUNyQixDQUFDO0FBQ0Y7QUFoQmdCOzs7QUNHaEIsSUFBTyxxQkFBUTtBQUFBLEVBQ2QsT0FBTyxRQUFRO0FBQ2QsV0FBTztBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sUUFBUTtBQUFBLElBQ1Q7QUFBQSxFQUNEO0FBQUEsRUFDQSxPQUFPLEtBQUs7QUFDWCxRQUNFLE1BQU0sV0FBVyxFQUNqQixNQUFNLFFBQVEsRUFDZCxNQUFNLElBQUksRUFDVixNQUFNLE1BQU0sRUFDWixNQUFNLFlBQVksRUFDbEIsTUFBTSxHQUFHLEVBQ1QsTUFBTSxLQUFLO0FBQUEsRUFDZDtBQUNEOyIsCiAgIm5hbWVzIjogWyJ1c2UiLCAidXNlIiwgInVzZSIsICJ1c2UiLCAidXNlIiwgInVzZSIsICJ1c2UiLCAidXNlIl0KfQo=
