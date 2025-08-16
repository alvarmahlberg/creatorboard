"use client";
import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, Coins, User, BarChart3, Users, DollarSign, Target, ArrowLeft, ExternalLink, Calendar, Hash } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

type CreatorCoin = {
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

type CoinDetailResponse = {
  profile: any;
  creatorCoin: CreatorCoin | null;
};



type HolderItem = {
  address: string;
  handle: string;
  balance: number;
  percentage: number;
  profileImage?: string;
  isMarket?: boolean;
  hasRealHandle?: boolean;
};

type HoldersResponse = {
  items: HolderItem[];
};

const fetcher = (url: string) => fetch(url, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
}).then(r => r.json());

export default function CoinPage() {
  const params = useParams();
  const address = params.address as string;
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Hae coin details
  const { data: coinData, error: coinError, isLoading: coinLoading } = useSWR<CoinDetailResponse>(
    address ? `/api/creator/coin?identifier=${address}` : null,
    fetcher,
    { 
      refreshInterval: 10000,
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      dedupingInterval: 0,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );

  // Hae holders
  const { data: holdersData, error: holdersError, isLoading: holdersLoading } = useSWR<HoldersResponse>(
    address ? `/api/creator/coins/holders?address=${address}` : null,
    fetcher,
    { 
      refreshInterval: 60000, // Holders päivittyy harvemmin
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      dedupingInterval: 0,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );

  const coin = coinData?.creatorCoin;
  const profile = coinData?.profile;
  const holders = holdersData?.items || [];



  useEffect(() => {
    setLastUpdated(new Date());
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (coinLoading) {
    return (
      <main className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (coinError || !coin) {
    return (
      <main className="space-y-6 p-4 sm:p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-sm text-red-600">Error: {String(coinError?.message || "Creator coin not found")}</div>
              <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to CreatorBoard
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Lasketaan tilastot
  const priceChange = coin.marketCapDelta24h / coin.marketCap;
  const isPositive = priceChange >= 0;
  const creationDate = new Date(coin.createdAt);
  const daysSinceCreation = Math.floor((Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Lasketaan holder percentages
  const totalSupply = coin.marketCap / coin.price; // Arvioidaan total supply
  
  // Lasketaan kaikki holder percentages
  const holdersWithPercentage = holders.map(holder => ({
    ...holder,
    percentage: totalSupply > 0 ? (holder.balance / totalSupply) * 100 : 0
  }));

  return (
    <main className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Avatar className="h-12 w-12">
            <AvatarImage src={coin.profileImage} alt={coin.name} />
            <AvatarFallback>
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{coin.displayName || coin.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>@{coin.creatorHandle}</span>
              <span>•</span>
              <span>{coin.symbol}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
          <Badge variant="secondary" className="flex items-center gap-1">
            LIVE
          </Badge>
          <span className="text-muted-foreground hidden sm:inline">
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '...'}
          </span>
        </div>
      </div>

      {/* Price Section - Referenssikuvan mukainen */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Side - Price Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={coin.profileImage} alt={coin.name} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-3xl font-bold">{coin.displayName || coin.name} {coin.symbol}</h2>
                  <p className="text-sm text-muted-foreground">#{coin.address.slice(0, 8)}...{coin.address.slice(-6)}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-4xl font-bold">${formatPrice(coin.price)}</div>
                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{formatPercentage(coin.marketCapDelta24h, coin.marketCap)}
                  </span>
                  <span className="text-sm text-muted-foreground">(24h)</span>
                </div>
              </div>

              {/* 24h Range */}
              <div className="space-y-2">
                <div className="text-sm font-medium">24h Range</div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">Low: ${formatPrice(coin.price * 0.95)}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full">
                    <div className="h-full bg-primary rounded-full w-1/2"></div>
                  </div>
                  <span className="text-muted-foreground">High: ${formatPrice(coin.price * 1.05)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                  Buy / Sell
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Wallet
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                  Earn Crypto
                </button>
              </div>
            </div>

            {/* Right Side - Financial Data */}
            <div className="lg:w-80 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Market Cap</div>
                  <div className="text-lg font-semibold">${formatCurrency(coin.marketCap)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">24h Volume</div>
                  <div className="text-lg font-semibold">${formatCurrency(coin.volume24h)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Volume</div>
                  <div className="text-lg font-semibold">${formatCurrency(coin.totalVolume)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Holders</div>
                  <div className="text-lg font-semibold">{formatNumber(coin.uniqueHolders)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{creationDate.toLocaleDateString()}</span>
                  <span className="text-sm text-muted-foreground">({daysSinceCreation} days ago)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Contract</div>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  <span className="font-mono text-sm">{coin.address.slice(0, 8)}...{coin.address.slice(-6)}</span>
                  <button className="p-1 hover:bg-muted rounded">
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - Käytetään etusivun komponentteja */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatCurrency(coin.marketCap)}</div>
            <p className="text-xs text-muted-foreground">
              {isPositive ? '+' : ''}{formatPercentage(coin.marketCapDelta24h, coin.marketCap)} from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatCurrency(coin.volume24h)}</div>
            <p className="text-xs text-muted-foreground">
              Trading activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Holders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(coin.uniqueHolders)}</div>
            <p className="text-xs text-muted-foreground">
              Unique addresses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Age</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysSinceCreation}</div>
            <p className="text-xs text-muted-foreground">
              Days since creation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Holders - Full width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Holders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {holdersLoading ? (
            <div className="space-y-4">
              {/* Market skeleton */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
              {/* Normal holders skeletons */}
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : holdersWithPercentage.length > 0 ? (
            <div className="space-y-4">
              {/* Market ja Creator kortit kuten kuvassa */}
              <div className="grid grid-cols-2 gap-4">
                {/* Market kortti */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs">❄️</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">Market</div>
                      <div className="text-xs text-muted-foreground">{holdersWithPercentage[0]?.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
                
                {/* Creator kortti */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-black flex items-center justify-center">
                      <span className="text-white text-xs">uu</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">Creator</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>50%</span>
                        <span className="text-yellow-500">🔒</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Normaalit holderit */}
              {holdersWithPercentage.slice(1, 8).map((holder, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={holder.profileImage} alt={holder.handle} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {holder.handle}
                        {!holder.hasRealHandle && (
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            Address
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{holder.balance.toFixed(2)} {coin.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">{holder.percentage.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">#{index + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No holders data
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function formatCurrency(amount: number): string {
  if (amount >= 1e9) {
    return (amount / 1e9).toFixed(1) + 'B';
  } else if (amount >= 1e6) {
    return (amount / 1e6).toFixed(1) + 'M';
  } else if (amount >= 1e3) {
    return (amount / 1e3).toFixed(1) + 'K';
  }
  return amount.toFixed(1);
}

function formatPercentage(change: number, marketCap: number): string {
  if (marketCap === 0) return '0.0%';
  const percentage = (change / marketCap) * 100;
  return percentage.toFixed(1) + '%';
}

function formatPrice(price: number): string {
  if (price < 0.01) {
    return price.toFixed(4);
  } else if (price < 1) {
    return price.toFixed(4);
  }
  return price.toFixed(4);
}

function formatNumber(num: number): string {
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  } else if (num < 1) {
    return "<1";
  }
  return num.toFixed(0);
}
