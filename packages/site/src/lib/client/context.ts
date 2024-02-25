import type { Session } from "@lil-indigestion-cards/core/types";

import { createContext, useContext } from "solid-js";
export const SessionContext = createContext<Session | null>(null);

export const useSession = () => useContext(SessionContext);

