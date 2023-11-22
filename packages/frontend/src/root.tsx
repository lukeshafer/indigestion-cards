// @refresh reload
import { Suspense } from 'solid-js';
import {
	useLocation,
	A,
	Body,
	ErrorBoundary,
	FileRoutes,
	Head,
	Html,
	Meta,
	Routes,
	Scripts,
	Title,
} from 'solid-start';
import './root.css';
import { color_theme } from '~/lib/page-config';

export default function Root() {
	const location = useLocation();
	const active = (path: string) =>
		path == location.pathname ? 'border-sky-600' : 'border-transparent hover:border-sky-600';
	return (
		<Html
			lang="en"
			classList={{ dark: color_theme() === 'dark' }}
			class="bg-gray-50 text-gray-950 dark:bg-gray-950 dark:font-medium dark:text-gray-50">
			<Head>
				<Title>SolidStart - With TailwindCSS</Title>
				<Meta charset="utf-8" />
				<Meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta
					name="theme-color"
					content={color_theme() === 'dark' ? '#030712' : '#ffffff'}
				/>
			</Head>
			<Body>
				<Suspense>
					<ErrorBoundary>
						<nav class="bg-sky-800">
							<ul class="container flex items-center p-3 text-gray-200">
								<li class={`border-b-2 ${active('/')} mx-1.5 sm:mx-6`}>
									<A href="/">Home</A>
								</li>
								<li class={`border-b-2 ${active('/about')} mx-1.5 sm:mx-6`}>
									<A href="/about">About</A>
								</li>
							</ul>
						</nav>
						<Routes>
							<FileRoutes />
						</Routes>
					</ErrorBoundary>
				</Suspense>
				<Scripts />
			</Body>
		</Html>
	);
}
