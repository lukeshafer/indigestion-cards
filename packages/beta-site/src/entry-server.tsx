// @refresh reload
import { createHandler, StartServer } from '@solidjs/start/server';
import { ASSETS } from '@site/constants';

export default createHandler(() => (
	<StartServer
		document={({ assets, children, scripts }) => (
			<html lang="en" class="">
				<head>
					<meta charset="utf-8" />
					<link rel="icon" type="image/png" href={ASSETS.FAVICON} />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					{assets}
				</head>
				<body class="min-h-screen bg-gray-50 font-medium text-gray-950 dark:bg-gray-900 dark:text-gray-50">
					<div id="app">{children}</div>
					{scripts}
				</body>
			</html>
		)}
	/>
));
