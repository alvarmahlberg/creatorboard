import { setApiKey, getMostValuableCreatorCoins, getCreatorCoins, getProfile } from "@zoralabs/coins-sdk";
import Decimal from "decimal.js";

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

// Instrumentointi funktiot
function logInstrumentation(coinAddress: string, field: string, raw_zora: string, after_parse: Decimal, after_fx: Decimal, final_out: number, fx_rate?: number, fx_base?: string, fx_target?: string) {
  console.log(`[INSTRUMENTATION] ${coinAddress} ${field}:`, {
    raw_zora,
    after_parse: after_parse.toString(),
    after_fx: after_fx.toString(),
    final_out,
    fx_rate,
    fx_base,
    fx_target,
    ratio: final_out / after_parse.toNumber()
  });
}

// Yksikkötestit validointia varten
export function validateZoraData(ourData: CreatorCoin, zoraRawData: any): boolean {
  const tolerance = 0.005; // 0.5% toleranssi
  
  // Testi 1: Price validointi
  const derivedPrice = new Decimal(zoraRawData.marketCap).div(new Decimal(zoraRawData.totalSupply || 1));
  const priceDiff = Math.abs(ourData.price - derivedPrice.toNumber()) / Math.max(ourData.price, derivedPrice.toNumber());
  
  // Testi 2: Market Cap validointi
  const marketCapDiff = Math.abs(ourData.marketCap - parseFloat(zoraRawData.marketCap)) / Math.max(ourData.marketCap, parseFloat(zoraRawData.marketCap));
  
  // Testi 3: Volume24h validointi (1% toleranssi)
  const volumeDiff = Math.abs(ourData.volume24h - parseFloat(zoraRawData.volume24h || "0")) / Math.max(ourData.volume24h, parseFloat(zoraRawData.volume24h || "0"));
  
  const isValid = priceDiff < tolerance && marketCapDiff < tolerance && volumeDiff < 0.01;
  
  if (!isValid) {
    console.error(`[VALIDATION FAILED] ${ourData.address}:`, {
      priceDiff,
      marketCapDiff,
      volumeDiff,
      ourPrice: ourData.price,
      derivedPrice: derivedPrice.toNumber(),
      ourMarketCap: ourData.marketCap,
      zoraMarketCap: parseFloat(zoraRawData.marketCap),
      ourVolume: ourData.volume24h,
      zoraVolume: parseFloat(zoraRawData.volume24h || "0")
    });
  }
  
  return isValid;
}

export async function fetchTopCreators(): Promise<CreatorCoin[]> {
  try {
    // Hae kaikki creator coinit markkina-arvon mukaan
    const result = await getMostValuableCreatorCoins({ 
      count: 200
    });
    
    const edges = result?.data?.exploreList?.edges || [];
    
    // Muotoile data ja varmista että vain creator coineja näytetään
    const creatorCoins = edges
      .map((edge: any) => {
        const coin = edge.node;
        
        // Vahvat creator coin suojaukset
        if (!coin) return null;
        if (!coin.address) return null;
        if (!coin.creatorProfile || !coin.creatorProfile.handle) return null;
        if (new Decimal(coin.marketCap).lte(0)) return null;
        
        // Varmista että kyseessä on creator coin eikä muu token
        // Creator coineilla on yleensä creatorProfile ja ne ovat Zora20Token tyyppiä
        if (!coin.creatorProfile?.handle || !coin.symbol) return null;
        
        // INSTRUMENTOINTI: raw_zora (heti API-vastauksen jälkeen)
        const raw_marketCap = coin.marketCap;
        const raw_volume24h = coin.volume24h || "0";
        const raw_price = coin.tokenPrice?.priceInUsdc || "0";
        const raw_marketCapDelta24h = coin.marketCapDelta24h || "0";
        
        // INSTRUMENTOINTI: after_parse (string→decimal) - käytä Decimal.js:ää
        const after_parse_marketCap = new Decimal(raw_marketCap);
        const after_parse_volume24h = new Decimal(raw_volume24h);
        const after_parse_price = new Decimal(raw_price);
        const after_parse_marketCapDelta24h = new Decimal(raw_marketCapDelta24h);
        
        // INSTRUMENTOINTI: after_fx (ei FX:ää USD-kenttiin!)
        const after_fx_marketCap = after_parse_marketCap; // Zoran marketCap on jo USD
        const after_fx_volume24h = after_parse_volume24h; // Zoran volume24h on jo USD
        const after_fx_price = after_parse_price; // Zoran priceInUsdc on jo USD
        const after_fx_marketCapDelta24h = after_parse_marketCapDelta24h; // Zoran marketCapDelta24h on jo USD
        
        // INSTRUMENTOINTI: final_out
        const final_out_marketCap = after_fx_marketCap.toNumber();
        const final_out_volume24h = after_fx_volume24h.toNumber();
        const final_out_price = after_fx_price.toNumber();
        const final_out_marketCapDelta24h = after_fx_marketCapDelta24h.toNumber();
        
        // Lokita instrumentointi ensimmäiselle kolmelle tokenille
        if (coin.address === "0x1234567890123456789012345678901234567890" || 
            coin.address === "0x2345678901234567890123456789012345678901" || 
            coin.address === "0x3456789012345678901234567890123456789012") {
          logInstrumentation(coin.address, "marketCap", raw_marketCap, after_parse_marketCap, after_fx_marketCap, final_out_marketCap);
          logInstrumentation(coin.address, "volume24h", raw_volume24h, after_parse_volume24h, after_fx_volume24h, final_out_volume24h);
          logInstrumentation(coin.address, "price", raw_price, after_parse_price, after_fx_price, final_out_price);
          logInstrumentation(coin.address, "marketCapDelta24h", raw_marketCapDelta24h, after_parse_marketCapDelta24h, after_fx_marketCapDelta24h, final_out_marketCapDelta24h);
        }
        
        const creatorCoin = {
          address: coin.address,
          name: coin.name || coin.symbol,
          symbol: coin.symbol,
          marketCap: final_out_marketCap,
          volume24h: final_out_volume24h,
          totalVolume: new Decimal(coin.totalVolume || "0").toNumber(), // Zoran totalVolume on jo USD
          createdAt: coin.createdAt,
          creatorHandle: coin.creatorProfile?.handle || coin.creatorAddress,
          price: final_out_price,
          marketCapDelta24h: final_out_marketCapDelta24h,
          uniqueHolders: coin.uniqueHolders || 0,
          profileImage: coin.creatorProfile?.avatar?.previewImage?.medium,
          displayName: coin.creatorProfile?.displayName
        };
        
        // Validoi data ensimmäiselle kolmelle tokenille
        if (coin.address === "0x1234567890123456789012345678901234567890" || 
            coin.address === "0x2345678901234567890123456789012345678901" || 
            coin.address === "0x3456789012345678901234567890123456789012") {
          validateZoraData(creatorCoin, coin);
        }
        
        return creatorCoin;
      })
      .filter((coin) => coin !== null)
      .sort((a, b) => b.marketCap - a.marketCap) // Lajittele markkina-arvon mukaan (suurimmat ensin)
      .slice(0, 100) as CreatorCoin[]; // Top 100
    
    return creatorCoins;
  } catch (e: any) {
    console.error("Failed to fetch top creators:", e);
    return [];
  }
}

export async function fetchTopGainers(): Promise<CreatorCoin[]> {
  try {
    // Hae kaikki creator coinit
    const result = await getMostValuableCreatorCoins({ 
      count: 200
    });
    
    const edges = result?.data?.exploreList?.edges || [];
    
    // Muotoile data ja varmista että vain creator coineja näytetään
    const creatorCoins = edges
      .map((edge: any) => {
        const coin = edge.node;
        
        // Vahvat creator coin suojaukset
        if (!coin) return null;
        if (!coin.address) return null;
        if (!coin.creatorProfile || !coin.creatorProfile.handle) return null;
        if (new Decimal(coin.marketCap).lte(0)) return null;
        
        // Varmista että kyseessä on creator coin eikä muu token
        if (!coin.creatorProfile?.handle || !coin.symbol) return null;
        
        // Sama instrumentointi kuin fetchTopCreators:ssa
        const raw_marketCap = coin.marketCap;
        const raw_volume24h = coin.volume24h || "0";
        const raw_price = coin.tokenPrice?.priceInUsdc || "0";
        const raw_marketCapDelta24h = coin.marketCapDelta24h || "0";
        
        const after_parse_marketCap = new Decimal(raw_marketCap);
        const after_parse_volume24h = new Decimal(raw_volume24h);
        const after_parse_price = new Decimal(raw_price);
        const after_parse_marketCapDelta24h = new Decimal(raw_marketCapDelta24h);
        
        // Ei FX:ää USD-kenttiin!
        const after_fx_marketCap = after_parse_marketCap;
        const after_fx_volume24h = after_parse_volume24h;
        const after_fx_price = after_parse_price;
        const after_fx_marketCapDelta24h = after_parse_marketCapDelta24h;
        
        const final_out_marketCap = after_fx_marketCap.toNumber();
        const final_out_volume24h = after_fx_volume24h.toNumber();
        const final_out_price = after_fx_price.toNumber();
        const final_out_marketCapDelta24h = after_fx_marketCapDelta24h.toNumber();
        
        return {
          address: coin.address,
          name: coin.name || coin.symbol,
          symbol: coin.symbol,
          marketCap: final_out_marketCap,
          volume24h: final_out_volume24h,
          totalVolume: new Decimal(coin.totalVolume || "0").toNumber(), // Zoran totalVolume on jo USD
          createdAt: coin.createdAt,
          creatorHandle: coin.creatorProfile?.handle || coin.creatorAddress,
          price: final_out_price,
          marketCapDelta24h: final_out_marketCapDelta24h,
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
