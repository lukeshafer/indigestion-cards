import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';

const app = new Hono();

let routes = app.get('/', c => c.text('Hello Hono!')).post('/', c => c.text('Post'));

export type SiteApi = typeof routes;

export const handler = handle(routes);
