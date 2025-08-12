import { setApiKey, getProfile, getCoinSwaps } from "@zoralabs/coins-sdk";

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

export async function fetchRecentActivity(coinAddress?: string) {
  if (!coinAddress) return [];
  
  try {
    const res = await getCoinSwaps({ 
      address: coinAddress,
      first: 50 // Haetaan 50 viimeisintä swapia
    });
    
    const swapActivities = res?.data?.zora20Token?.swapActivities?.edges || [];
    
    return swapActivities.map((edge: any) => {
      const swap = edge.node;
      return {
        time: swap.blockTimestamp,
        token: swap.senderProfile?.handle || "Unknown",
        action: swap.activityType,
        volume: swap.currencyAmountWithPrice?.currencyAmount?.amountDecimal || 0,
        amount: parseFloat(swap.coinAmount) / Math.pow(10, 18), // Muunna wei:sta ETH:ksi
        transaction: swap.transactionHash || "",
        price: swap.currencyAmountWithPrice?.priceUsdc || 0
      };
    });
  } catch (e: any) {
    console.error("Failed to fetch recent activity:", e);
    return [];
  }
}
