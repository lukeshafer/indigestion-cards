export function setAdminEnvSession(username: string, userId: string) {
	process.env.SESSION_USER_ID = userId;
	process.env.SESSION_TYPE = 'admin';
	process.env.SESSION_USERNAME = username;
}
