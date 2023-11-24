// @refresh reload
import { Suspense } from 'solid-js';
import { Routes } from '@solidjs/router';
import {
	Body,
	ErrorBoundary,
	FileRoutes,
	Head,
	Html,
	Link,
	Meta,
	Scripts,
	Title,
} from 'solid-start';
import './root.css';
import '@fontsource-variable/montserrat';
import { color_theme } from '~/lib/page-config';
import PageLayout from './components/PageLayout';
import { QueryClientProvider, QueryClient } from '@tanstack/solid-query';
import { ASSETS } from './lib/constants';

const queryClient = new QueryClient();

export default function Root() {
	return (
		<Html
			lang="en"
			classList={{ dark: color_theme() === 'dark' }}
			class="bg-gray-50 text-gray-950 dark:bg-gray-950 dark:font-medium dark:text-gray-50">
			<Head>
				<Title>Indigestion Cards</Title>
				<Meta charset="utf-8" />
				<Link rel="icon" type="image/png" href={ASSETS.FAVICON} />
				<Meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta
					name="theme-color"
					content={color_theme() === 'dark' ? '#030712' : '#ffffff'}
				/>
			</Head>
			<Body>
				<Suspense>
					<ErrorBoundary>
						<QueryClientProvider client={queryClient}>
							<PageLayout>
								<Routes>
									<FileRoutes />
								</Routes>
							</PageLayout>
						</QueryClientProvider>
					</ErrorBoundary>
				</Suspense>
				<Scripts />
			</Body>
		</Html>
	);
}
