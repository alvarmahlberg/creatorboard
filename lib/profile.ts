import { setApiKey, getProfile, getCoinHolders } from "@zoralabs/coins-sdk";
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
        profileImage: coin.creatorProfile?.avatar?.previewImage?.medium
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
