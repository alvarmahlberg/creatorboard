import { setApiKey, getProfile, getCoinSwaps } from "@zoralabs/coins-sdk";
import Decimal from "decimal.js";

if (process.env.ZORA_API_KEY) setApiKey(process.env.ZORA_API_KEY);

export type Identifier = string; // wallet 0x... or @handle

export async function fetchCreatorCoin(identifier: Identifier) {
  const res = await getProfile({ 
    identifier
  });
  const profile: any = res?.data?.profile;
  const creatorCoin = profile?.creatorCoin || null;
  
  // Jos creator coin löytyy, lisätään uniqueHolders tieto
  if (creatorCoin) {
    creatorCoin.uniqueHolders = creatorCoin.uniqueHolders || 0;
  }
  
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
      first: 50, // Haetaan 50 viimeisintä swapia
      chain: 8453 // Eksplisiittisesti Base chain
    });
    
    const swapActivities = res?.data?.zora20Token?.swapActivities?.edges || [];
    
    return swapActivities.map((edge: any) => {
      const swap = edge.node;
      return {
        time: swap.blockTimestamp,
        token: swap.senderProfile?.handle || "Unknown",
        action: swap.activityType,
        volume: swap.currencyAmountWithPrice?.currencyAmount?.amountDecimal || 0,
        amount: new Decimal(swap.coinAmount).div(new Decimal(10).pow(18)).toNumber(), // Muunna wei:sta ETH:ksi käyttäen Decimal.js:ää
        transaction: swap.transactionHash || "",
        price: swap.currencyAmountWithPrice?.priceUsdc || 0 // Zoran priceUsdc on jo USD
      };
    });
  } catch (e: any) {
    console.error("Failed to fetch recent activity:", e);
    return [];
  }
}
