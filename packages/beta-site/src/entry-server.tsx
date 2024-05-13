// @refresh reload
import { createHandler, StartServer } from '@solidjs/start/server';
import { ASSETS } from '~/constants';

export default createHandler(() => (
	<StartServer
		document={({ assets, children, scripts }) => (
			<html
				lang="en"
				class="bg-gray-50 text-gray-950 dark:bg-gray-950 dark:font-medium dark:text-gray-50">
				<head>
					<meta charset="utf-8" />
					<link rel="icon" type="image/png" href={ASSETS.FAVICON} />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					{assets}
				</head>
				<body>
					<div id="app">{children}</div>
					{scripts}
				</body>
			</html>
		)}
	/>
));

