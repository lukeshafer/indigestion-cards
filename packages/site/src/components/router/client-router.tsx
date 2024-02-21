import { Router as SolidRouter, Route } from '@solidjs/router';
import { isServer } from 'solid-js/web';
import Page from '@/components/Page';
import { ClientContext, type ClientContextProps } from '@/client/context';
import { routes } from '@/routes';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';

const queryClient = new QueryClient();

export default function Router(props: {
  ssrUrl: string;
  ssrCtx: ClientContextProps;
  ssrRoute: {
    pattern: string;
    data: any;
  };
}) {
  return (
    <div>
      <ClientContext.Provider value={props.ssrCtx}>
        <QueryClientProvider client={queryClient}>
          <SolidRouter url={isServer ? props.ssrUrl : ''} root={Page}>
            {routes.map(route => {
              return (
                <Route
                  path={route.route}
                  component={route.component}
                  load={
                    isServer && route.route === props.ssrRoute?.pattern
                      ? () => props.ssrRoute.data
                      : () => undefined
                      // TODO: add resource proxy/getter to fetch all the data
                  }
                />
              );
            })}
            <Route path="*404" component={() => <div>404</div>} />
          </SolidRouter>
        </QueryClientProvider>
      </ClientContext.Provider>
    </div>
  );
}
