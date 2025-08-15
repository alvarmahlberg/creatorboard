"use client";
import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { ThemeToggle } from "@/components/theme-toggle";
import { TrendingUp, TrendingDown, Activity, Coins, User, ChevronUp, ChevronDown, BarChart3, Users, DollarSign, Target } from "lucide-react";

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

type TopCreatorsResponse = {
  items: CreatorCoin[];
};

type SortField = 'marketCap' | 'volume24h' | 'totalVolume' | 'marketCapDelta24h' | 'price' | 'uniqueHolders';
type SortDirection = 'asc' | 'desc';

const fetcher = (url: string) => fetch(url, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
}).then(r => r.json());

export default function Page() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data: creatorsData, error: creatorsError, mutate: creatorsMutate, isLoading: creatorsLoading } = useSWR<TopCreatorsResponse>(
    '/api/top-creators',
    fetcher,
    { 
      refreshInterval: 10000, // Päivitä 10 sekunnin välein
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      dedupingInterval: 0, // Ei deduplikointia
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );


  
  // Lajittele data dynaamisesti
  const sortedData = useMemo(() => {
    if (!creatorsData?.items) {
      return [];
    }
    
    return [...creatorsData.items].sort((a, b) => {
      let aValue: number;
      let bValue: number;
      
      switch (sortField) {
        case 'marketCap':
          aValue = a.marketCap;
          bValue = b.marketCap;
          break;
        case 'volume24h':
          aValue = a.volume24h;
          bValue = b.volume24h;
          break;
        case 'totalVolume':
          aValue = a.totalVolume;
          bValue = b.totalVolume;
          break;
        case 'marketCapDelta24h':
          aValue = a.marketCapDelta24h / a.marketCap;
          bValue = b.marketCapDelta24h / b.marketCap;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;

        case 'uniqueHolders':
          aValue = a.uniqueHolders;
          bValue = b.uniqueHolders;
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }, [creatorsData, sortField, sortDirection]);



  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Jos sama kolumni, vaihda suuntaa
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Jos uusi kolumni, aseta se ja oletussuunta
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 opacity-30" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  useEffect(() => {
    setLastUpdated(new Date());
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);



  if (creatorsError) {
    return (
      <main className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-red-600">Error: {String(creatorsError?.message || "Failed to load")}</div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Lasketaan tilastot
  const totalMarketCap = sortedData.reduce((sum, coin) => sum + coin.marketCap, 0);
  const totalVolume24h = sortedData.reduce((sum, coin) => sum + coin.volume24h, 0);
  const totalHolders = sortedData.reduce((sum, coin) => sum + coin.uniqueHolders, 0);
  const avgPriceChange = sortedData.length > 0 
    ? sortedData.reduce((sum, coin) => sum + (coin.marketCapDelta24h / coin.marketCap), 0) / sortedData.length 
    : 0;

  return (
    <main className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">CreatorBoard</h1>
            <p className="text-sm text-muted-foreground">
              Live market data from Zora ecosystem
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            LIVE
          </Badge>
          <button
            onClick={() => {
              creatorsMutate();
              setLastUpdated(new Date());
            }}
            className="p-1 hover:bg-muted rounded transition-colors"
            title="Päivitä data"
          >
            <Activity className="h-3 w-3" />
          </button>
          <span className="text-muted-foreground hidden sm:inline">
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '...'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatCurrency(totalMarketCap)}</div>
            <p className="text-xs text-muted-foreground">
              Across {sortedData.length} creator coins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatCurrency(totalVolume24h)}</div>
            <p className="text-xs text-muted-foreground">
              Total trading volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Gainers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedData
                .filter(coin => coin.marketCapDelta24h > 0)
                .sort((a, b) => (b.marketCapDelta24h / b.marketCap) - (a.marketCapDelta24h / a.marketCap))
                .slice(0, 3)
                .map((coin, index) => (
                  <div key={coin.address} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={coin.profileImage} alt={coin.name} />
                        <AvatarFallback className="text-xs">
                          <User className="h-2 w-2" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate max-w-16">
                        {coin.symbol || coin.name.slice(0, 8)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-green-600">
                      +{formatPercentage(coin.marketCapDelta24h, coin.marketCap)}
                    </span>
                  </div>
                ))}
              {sortedData.filter(coin => coin.marketCapDelta24h > 0).length === 0 && (
                <p className="text-xs text-muted-foreground">Ei nousussa olevia kolikkoja</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Losers</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedData
                .filter(coin => coin.marketCapDelta24h < 0)
                .sort((a, b) => (a.marketCapDelta24h / a.marketCap) - (b.marketCapDelta24h / b.marketCap))
                .slice(0, 3)
                .map((coin, index) => (
                  <div key={coin.address} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={coin.profileImage} alt={coin.name} />
                        <AvatarFallback className="text-xs">
                          <User className="h-2 w-2" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate max-w-16">
                        {coin.symbol || coin.name.slice(0, 8)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-red-600">
                      {formatPercentage(coin.marketCapDelta24h, coin.marketCap)}
                    </span>
                  </div>
                ))}
              {sortedData.filter(coin => coin.marketCapDelta24h < 0).length === 0 && (
                <p className="text-xs text-muted-foreground">Ei laskussa olevia kolikkoja</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Creator Coins Table - Full width */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Top 100 Creator Coins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[800px] sm:min-w-full">
                    <TableHeader>
                      <TableRow>
                      <TableHead className="text-xs sm:text-sm">Rank</TableHead>
                      <TableHead className="text-xs sm:text-sm">Creator</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors text-xs sm:text-sm"
                        onClick={() => handleSort('marketCap')}
                      >
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="hidden sm:inline">Market Cap</span>
                          <span className="sm:hidden">MCap</span>
                          {getSortIcon('marketCap')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors text-xs sm:text-sm"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center gap-1 sm:gap-2">
                          Price
                          {getSortIcon('price')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors text-xs sm:text-sm"
                        onClick={() => handleSort('marketCapDelta24h')}
                      >
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="hidden sm:inline">24H Change</span>
                          <span className="sm:hidden">24H</span>
                          {getSortIcon('marketCapDelta24h')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors text-xs sm:text-sm"
                        onClick={() => handleSort('volume24h')}
                      >
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="hidden sm:inline">24h Volume</span>
                          <span className="sm:hidden">Vol</span>
                          {getSortIcon('volume24h')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors text-xs sm:text-sm"
                        onClick={() => handleSort('uniqueHolders')}
                      >
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="hidden sm:inline">Holders</span>
                          <span className="sm:hidden">Hold</span>
                          {getSortIcon('uniqueHolders')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((coin, index) => (
                      <TableRow key={coin.address} className="hover:bg-muted/50 active:bg-muted/70 transition-colors">
                        <TableCell className="font-medium text-xs sm:text-sm">#{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                              <AvatarImage src={coin.profileImage} alt={coin.name} />
                              <AvatarFallback>
                                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-xs sm:text-sm truncate">{coin.displayName || coin.name}</div>
                              <div className="text-xs text-muted-foreground truncate">@{coin.creatorHandle}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm">${formatCurrency(coin.marketCap)}</TableCell>
                        <TableCell className="font-mono text-xs sm:text-sm">${formatPrice(coin.price)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {coin.marketCapDelta24h >= 0 ? (
                              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                            )}
                            <span className={`font-medium text-xs sm:text-sm ${
                              coin.marketCapDelta24h >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {coin.marketCapDelta24h >= 0 ? '+' : ''}{formatPercentage(coin.marketCapDelta24h, coin.marketCap)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">${formatCurrency(coin.volume24h)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{formatNumber(coin.uniqueHolders)}</TableCell>
                      </TableRow>
                    ))}
                    {creatorsLoading && (
                      <>
                        {Array.from({ length: 20 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-3 w-6 sm:h-4 sm:w-8" /></TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 sm:gap-3">
                                <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full" />
                                <div className="space-y-1 sm:space-y-2 flex-1">
                                  <Skeleton className="h-3 w-16 sm:h-4 sm:w-20" />
                                  <Skeleton className="h-2 w-12 sm:h-3 sm:w-16" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-3 w-8 sm:h-4 sm:w-12" /></TableCell>
                            <TableCell><Skeleton className="h-3 w-16 sm:h-4 sm:w-20" /></TableCell>
                            <TableCell><Skeleton className="h-3 w-12 sm:h-4 sm:w-16" /></TableCell>
                            <TableCell><Skeleton className="h-3 w-8 sm:h-4 sm:w-12" /></TableCell>
                            <TableCell><Skeleton className="h-3 w-12 sm:h-4 sm:w-16" /></TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                    {!creatorsLoading && !sortedData.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No creator coins found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
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
  }
  return num.toString();
}


