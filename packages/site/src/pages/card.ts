import type { APIRoute } from 'astro';
import { routes } from '@/constants';

export const get: APIRoute = async ({ redirect }) => redirect(routes.DESIGNS);
