import { setApiKey, getProfile, getCoinSwaps, getCoinHolders } from "@zoralabs/coins-sdk";
import Decimal from "decimal.js";

if (process.env.ZORA_API_KEY) setApiKey(process.env.ZORA_API_KEY);

export type Identifier = string; // wallet 0x... or @handle

export async function fetchCreatorCoin(identifier: Identifier) {
  try {
    // Kokeile ensin getProfile API:a
    const res = await getProfile({ 
      identifier
    });
    const profile: any = res?.data?.profile;
    let creatorCoin = profile?.creatorCoin || null;
    
    // Jos creator coin löytyy, lisätään uniqueHolders tieto
    if (creatorCoin) {
      creatorCoin.uniqueHolders = creatorCoin.uniqueHolders || 0;
      return { profile, creatorCoin };
    }
    
    // Jos getProfile ei löydä, kokeile etsiä getMostValuableCreatorCoins:sta
    const { getMostValuableCreatorCoins } = await import("@zoralabs/coins-sdk");
    const coinsRes = await getMostValuableCreatorCoins({ 
      count: 200
    });
    
    const edges = coinsRes?.data?.exploreList?.edges || [];
    const foundCoin = edges.find((edge: any) => edge.node.address === identifier);
    
    if (foundCoin) {
      const coin = foundCoin.node;
      creatorCoin = {
        address: coin.address,
        name: coin.name || coin.symbol,
        symbol: coin.symbol,
        marketCap: parseFloat(coin.marketCap),
        volume24h: parseFloat(coin.volume24h || "0"),
        totalVolume: parseFloat(coin.totalVolume || "0"),
        createdAt: coin.createdAt,
        creatorHandle: coin.creatorProfile?.handle || coin.creatorAddress,
        price: parseFloat(coin.tokenPrice?.priceInUsdc || "0"),
        marketCapDelta24h: parseFloat(coin.marketCapDelta24h || "0"),
        uniqueHolders: coin.uniqueHolders || 0,
        profileImage: coin.creatorProfile?.avatar?.previewImage?.medium,
        displayName: coin.creatorProfile?.displayName
      };
    }
    
    return { profile, creatorCoin };
  } catch (e: any) {
    console.error("Error fetching creator coin:", e);
    return { profile: null, creatorCoin: null };
  }
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
  console.log("=== fetchRecentActivity called with:", coinAddress);
  if (!coinAddress) return [];
  
  try {
    const res = await getCoinSwaps({ 
      address: coinAddress,
      first: 50, // Haetaan 50 viimeisintä swapia
      chain: 8453 // Eksplisiittisesti Base chain
    });
    
    console.log("=== getCoinSwaps response:", res?.data?.zora20Token?.swapActivities?.edges?.length || 0, "swaps");
    
    const swapActivities = res?.data?.zora20Token?.swapActivities?.edges || [];
    
    return swapActivities.map((edge: any) => {
      const swap = edge.node;
      const amount = new Decimal(swap.coinAmount).div(new Decimal(10).pow(18)).toNumber();
      const price = swap.currencyAmountWithPrice?.priceUsdc || 0;
      const value = amount * price;
      
      // Muunna timestamp aikaa sitten
      let timeAgo = "1h"; // Fallback
      if (swap.blockTimestamp) {
        try {
          // Lohkokejudata on Unix timestamp sekunteina
          const now = Math.floor(Date.now() / 1000); // Nykyinen aika sekunteina
          const diffInSeconds = now - swap.blockTimestamp;
          const diffInMinutes = Math.floor(diffInSeconds / 60);
          const diffInHours = Math.floor(diffInMinutes / 60);
          
          console.log("Time debug:", {
            blockTimestamp: swap.blockTimestamp,
            now,
            diffInSeconds,
            diffInMinutes,
            diffInHours
          });
          
          if (diffInSeconds < 0) {
            timeAgo = "now";
          } else if (diffInHours > 0) {
            timeAgo = `${diffInHours}h`;
          } else if (diffInMinutes > 0) {
            timeAgo = `${diffInMinutes}m`;
          } else {
            timeAgo = "now";
          }
        } catch (e) {
          console.error("Error parsing timestamp:", e);
          timeAgo = "1h";
        }
      }
      
      return {
        time: timeAgo,
        token: swap.senderProfile?.handle || swap.senderProfile?.address?.slice(0, 6) + '...' + swap.senderProfile?.address?.slice(-4) || "Unknown",
        action: swap.activityType === "SWAP_IN" ? "Buy" : "Sell",
        amount: amount,
        value: value,
        profileImage: swap.senderProfile?.avatar?.previewImage?.medium
      };
    });
  } catch (e: any) {
    console.error("Failed to fetch recent activity:", e);
    return [];
  }
}

export async function fetchCoinHolders(coinAddress?: string) {
  if (!coinAddress) return [];
  
  try {
    const res = await getCoinHolders({
      chainId: 8453, // Base mainnet
      address: coinAddress,
      count: 20 // Haetaan top 20 holderia
    });
    
    const holders = res?.data?.zora20Token?.tokenBalances?.edges || [];
    
    // Muunna holderit yksinkertaisesti - ensimmäinen on Market
    const processedHolders = holders.map((edge: any, index: number) => {
      const holder = edge.node;
      const hasHandle = holder.ownerProfile?.handle;
      
      return {
        address: holder.ownerAddress,
        handle: index === 0 ? "Market" : (hasHandle || holder.ownerAddress.slice(0, 6) + '...' + holder.ownerAddress.slice(-4)),
        balance: new Decimal(holder.balance).div(new Decimal(10).pow(18)).toNumber(),
        percentage: 0,
        profileImage: holder.ownerProfile?.avatar?.previewImage?.medium,
        isMarket: index === 0, // Ensimmäinen on Market
        hasRealHandle: index === 0 ? false : !!hasHandle
      };
    });
    
    return processedHolders;
  } catch (e: any) {
    console.error("Failed to fetch coin holders:", e);
    return [];
  }
}
