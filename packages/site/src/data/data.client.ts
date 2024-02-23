import { createClient } from "./lib/client";
import type { Data } from "./data.server";

export const client = createClient<Data>()
export type Route = ReturnType<typeof client['defineRoute']>
