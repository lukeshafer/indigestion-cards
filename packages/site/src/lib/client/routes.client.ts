import type { JSX } from 'solid-js';
import type { RouteName, KeyArray, RoutesDefinition } from '../routes.config.ts';

function defineRoute<R extends RouteName>(
  name: R,
  component: () => JSX.Element
) {
const

  return <Route />
}

const routes = defineRoutes({
  '/': {
    data: ['user'] as const,
    params: url => ({
      username: url.searchParams.get('username') || 'snailyluke',
    }),
  },
  '/users': { data: ['users'] },
})

function defineRoutes<K extends KeyArray>(def: RoutesDefinition<K>) {

}

//export default function Home(props: RouteSectionProps) {
  //const [data, { refetch }] = createResource(
    //async () => {
      //const users = await get('users');
      //return [...users, ...users];
    //},
    //{ initialValue: props.data.users, ssrLoadFrom: 'initial' }
  //);

  //onMount(() => {
    //refetch();
  //})

  //createEffect(() => {
    ////refetch();
    //console.log(data());
  //});

  //const siteConfig = createQuery(() => ({
    //queryKey: ['site-config'],
    //queryFn: () => trpc.siteConfig.query(),
  //}));

