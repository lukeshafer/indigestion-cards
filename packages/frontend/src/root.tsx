// @refresh reload
import { Suspense } from 'solid-js';
import { useLocation, A, Routes } from '@solidjs/router';
import { Body, ErrorBoundary, FileRoutes, Head, Html, Meta, Scripts, Title } from 'solid-start';
import './root.css';
import '@fontsource-variable/montserrat';
import { color_theme } from '~/lib/page-config';
import PageLayout from './components/PageLayout';

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
						<PageLayout>
							<Routes>
								<FileRoutes />
							</Routes>
						</PageLayout>
					</ErrorBoundary>
				</Suspense>
				<Scripts />
			</Body>
		</Html>
	);
}
