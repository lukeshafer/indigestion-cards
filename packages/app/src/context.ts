import type { Session } from '@lil-indigestion-cards/core/types';

export type ClientContextProps = {
	session: Session | null;
	disableAnimations: boolean;
}

import { createContext } from 'solid-js';
export  const ClientContext = createContext<ClientContextProps | null>(null);
