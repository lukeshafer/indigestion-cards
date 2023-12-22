// @refresh reload
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start';
import PageLayout from './components/PageLayout';
import './app.css';
import '@fontsource-variable/montserrat';

export default function App() {
	return (
		<Router root={PageLayout}>
			<FileRoutes />
		</Router>
	);
}
