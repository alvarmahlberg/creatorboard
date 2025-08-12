import { setApiKey, getProfile } from "@zoralabs/coins-sdk";

if (process.env.ZORA_API_KEY) setApiKey(process.env.ZORA_API_KEY);

export type Identifier = string; // wallet 0x... or @handle

export async function fetchCreatorCoin(identifier: Identifier) {
  const res = await getProfile({ identifier });
  const profile: any = res?.data?.profile;
  const creatorCoin = profile?.creatorCoin || null;
  return { profile, creatorCoin };
}

export async function fetchCreatorCoinsBatch(identifiers: Identifier[]) {
  const out: { identifier: string; creatorCoin: any | null; error?: string }[] = [];
  for (const id of identifiers) {
    try {
      const { creatorCoin } = await fetchCreatorCoin(id);
      out.push({ identifier: id, creatorCoin });
    } catch (e: any) {
      out.push({ identifier: id, creatorCoin: null, error: e?.message || "Failed to load" });
    }
  }
  return out;
}
