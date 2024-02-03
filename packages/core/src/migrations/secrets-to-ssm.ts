import { getTwitchTokens, setTwitchTokens } from '../lib/twitch';

export async function migration() {
  const tokens = await getTwitchTokens()
  await setTwitchTokens(tokens)
}
