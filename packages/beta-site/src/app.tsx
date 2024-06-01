import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import './app.css';
import '@fontsource-variable/montserrat';
import PageRoot from './components/PageRoot';

export default function App() {
	return (
		<Router root={PageRoot}>
			<FileRoutes />
		</Router>
	);
}
