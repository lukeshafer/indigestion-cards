import { type ComponentProps, Show, type ParentProps, Suspense } from 'solid-js';

import Breadcrumbs from './Breadcrumbs';
import Header from './Header';
import Footer from './Footer';
import AlertBox from './AlertBox';

export default function Page(
  props: ParentProps<{
    hideBreadcrumbs?: boolean;
    logo?: ComponentProps<typeof Header>['logo'];
    breadcrumbs?: ComponentProps<typeof Breadcrumbs>['path'];
    wide?: boolean;
  }>
) {
  return (
    <div
      class="grid h-[100svh] grid-cols-1 overflow-hidden md:grid-cols-[max-content_1fr]"
      id="page-layout-wrapper">
      <div
        class="relative flex flex-col overflow-y-scroll bg-gray-50 dark:bg-gray-950 md:col-start-2"
        id="page-scroll-wrapper">
        <Header logo={props.logo} />
        <AlertBox alerts={[]} />
        <Show when={!props.hideBreadcrumbs}>
          <div class="max-w-main mx-auto w-full">
            <Breadcrumbs path={props.breadcrumbs ?? []} />
          </div>
        </Show>
        <main
          style={{ 'view-transition-name': props.wide ? undefined : 'main' }}
          classList={{ 'max-w-main': !props.wide }}
          class="@container/main z-0 col-start-2 mx-auto mb-8 w-full flex-1">
          <Suspense>
            {props.children}
          </Suspense>
        </main>
        <div id="card-preview"></div>
        <Footer />
      </div>
    </div>
  );
}
