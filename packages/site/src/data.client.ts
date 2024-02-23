import { createClient } from "@data-router/client"
import type { Data } from "./data.server"

export const client = createClient<Data>()
