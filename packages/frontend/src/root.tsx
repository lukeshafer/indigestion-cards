/* @refresh reload */
import { render } from 'solid-js/web';
import { Route, Router } from '@solidjs/router';

import './index.css';
import Home from './routes/index';

const root = document.getElementById('root');

if (!root) {
	throw new Error('Root div not found.');
}

render(
	() => (
		<Router>
			<Route path="/" component={Home} />
			<Route path="/bye" component={() => <p>BYE</p>} />
		</Router>
	),
	root
);
