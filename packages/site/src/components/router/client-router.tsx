import { Router as SolidRouter, Route } from '@solidjs/router';
import { onMount, type ParentProps } from 'solid-js';
import { isServer } from 'solid-js/web';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/solid-query'
import Home from './Home'

const queryClient = new QueryClient();

function Root(props: ParentProps) {
  return (
    <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
  )
}

export default function Router(props: { url: string }) {
  onMount(() => {
    console.log('client log test');
  });

  return (
    <SolidRouter url={isServer ? props.url : ''} base="/new" root={Root}>
      <Route path="/" component={Home} />
    </SolidRouter>
  );
}
