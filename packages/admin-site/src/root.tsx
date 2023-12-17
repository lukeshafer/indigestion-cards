/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import 'simpledotcss';
import Layout from './components/Layout';

import Index from './routes/index';
import AdminUsers from './routes/admin-users';

render(
	() => (
		<Router root={Layout}>
			<Route path="/" component={Index} />
			<Route path="/admin-users" component={AdminUsers} />
		</Router>
	),
	document.getElementById('root')!
);
