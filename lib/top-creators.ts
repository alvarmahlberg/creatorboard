import { setApiKey, getMostValuableCreatorCoins, getCreatorCoins, getProfile } from "@zoralabs/coins-sdk";

if (process.env.ZORA_API_KEY) {
  setApiKey(process.env.ZORA_API_KEY);
}

export type CreatorCoin = {
  address: string;
  name: string;
  symbol: string;
  marketCap: number;
  volume24h: number;
  totalVolume: number;
  createdAt: string;
  creatorHandle: string;
  price: number;
  marketCapDelta24h: number;
  uniqueHolders: number;
  profileImage?: string;
  displayName?: string;
};

export async function fetchTopCreators(): Promise<CreatorCoin[]> {
  try {
    // Hae kaikki creator coinit markkina-arvon mukaan
    const result = await getMostValuableCreatorCoins({ count: 200 });
    
    const edges = result?.data?.exploreList?.edges || [];
    
    // Muotoile data ja varmista että vain creator coineja näytetään
    const creatorCoins = edges
      .map((edge: any) => {
        const coin = edge.node;
        
        // Vahvat creator coin suojaukset
        if (!coin) return null;
        if (!coin.address) return null;
        if (!coin.creatorProfile || !coin.creatorProfile.handle) return null;
        if (parseFloat(coin.marketCap) <= 0) return null;
        
        // Varmista että kyseessä on creator coin eikä muu token
        // Creator coineilla on yleensä creatorProfile ja ne ovat Zora20Token tyyppiä
        if (!coin.creatorProfile?.handle || !coin.symbol) return null;
        
        return {
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
      })
      .filter((coin) => coin !== null)
      .slice(0, 200) as CreatorCoin[]; // Top 200
    
    return creatorCoins;
  } catch (e: any) {
    console.error("Failed to fetch top creators:", e);
    return [];
  }
}

export async function fetchTopGainers(): Promise<CreatorCoin[]> {
  try {
    // Hae kaikki creator coinit
    const result = await getMostValuableCreatorCoins({ count: 200 });
    
    const edges = result?.data?.exploreList?.edges || [];
    
    // Muotoile data ja varmista että vain creator coineja näytetään
    const creatorCoins = edges
      .map((edge: any) => {
        const coin = edge.node;
        
        // Vahvat creator coin suojaukset
        if (!coin) return null;
        if (!coin.address) return null;
        if (!coin.creatorProfile || !coin.creatorProfile.handle) return null;
        if (parseFloat(coin.marketCap) <= 0) return null;
        
        // Varmista että kyseessä on creator coin eikä muu token
        if (!coin.creatorProfile?.handle || !coin.symbol) return null;
        
        return {
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
      })
      .filter((coin) => coin !== null) as CreatorCoin[];
    
    // Järjestä 24h muutoksen mukaan (suurimmat gainers ensin)
    const topGainers = creatorCoins
      .sort((a, b) => {
        const aChange = a.marketCapDelta24h / a.marketCap;
        const bChange = b.marketCapDelta24h / b.marketCap;
        return bChange - aChange; // Suurimmat gainers ensin
      })
      .slice(0, 200); // Top 200 gainers
    
    return topGainers;
  } catch (e: any) {
    console.error("Failed to fetch top gainers:", e);
    return [];
  }
}
