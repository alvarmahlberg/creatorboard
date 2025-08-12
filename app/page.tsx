"use client";
import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { ThemeToggle } from "@/components/theme-toggle";
import { TrendingUp, TrendingDown, Activity, Coins, User, TrendingUpIcon, ChevronUp, ChevronDown } from "lucide-react";

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

const fetcher = (url: string) => fetch(url).then(r => r.json());

type TabType = 'creators' | 'gainers';

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabType>('creators');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');


  const { data: creatorsData, error: creatorsError, mutate: creatorsMutate, isLoading: creatorsLoading } = useSWR<TopCreatorsResponse>(
    activeTab === 'creators' ? '/api/top-creators' : null,
    fetcher,
    { 
      refreshInterval: 60000,
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 0
    }
  );

  const { data: gainersData, error: gainersError, mutate: gainersMutate, isLoading: gainersLoading } = useSWR<TopCreatorsResponse>(
    activeTab === 'gainers' ? '/api/top-gainers' : null,
    fetcher,
    { 
      refreshInterval: 60000,
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 0
    }
  );

  const currentData = activeTab === 'creators' ? creatorsData : gainersData;
  const currentError = activeTab === 'creators' ? creatorsError : gainersError;
  const currentLoading = activeTab === 'creators' ? creatorsLoading : gainersLoading;
  const currentMutate = activeTab === 'creators' ? creatorsMutate : gainersMutate;

  // Lajittele data dynaamisesti
  const sortedData = useMemo(() => {
    if (!currentData?.items) return [];
    
    return [...currentData.items].sort((a, b) => {
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
  }, [currentData, sortField, sortDirection]);



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

  if (currentError) {
    return (
      <main className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-red-600">Error: {String(currentError?.message || "Failed to load")}</div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-4 sm:space-y-8 p-2 sm:p-4">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-2xl">Creator Coins</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Live market data from Zora ecosystem
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="flex h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <Activity className="h-3 w-3" />
                <span className="hidden sm:inline">LIVE</span>
              </Badge>
              <span className="text-muted-foreground hidden sm:inline">
                Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '...'}
              </span>
              {/* <ThemeToggle /> */}
            </div>
          </div>
          
          {/* Välilehdet - mobiilioptimoidut (piilotettu toistaiseksi) */}
          {/* <div className="flex space-x-1 mt-4 px-0 sm:px-0">
            <button
              onClick={() => {
                setActiveTab('creators');
                setSortField('marketCap');
                setSortDirection('desc');
              }}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors active:scale-95 ${
                activeTab === 'creators'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Market Cap
            </button>
            <button
              onClick={() => {
                setActiveTab('gainers');
                setSortField('marketCapDelta24h');
                setSortDirection('desc');
              }}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1 sm:gap-2 active:scale-95 ${
                activeTab === 'gainers'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <TrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Top Gainers</span>
              <span className="sm:hidden">Gainers</span>
            </button>
          </div> */}
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[1000px] sm:min-w-full">
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
                    onClick={() => handleSort('totalVolume')}
                  >
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="hidden sm:inline">Total Volume</span>
                      <span className="sm:hidden">Tot Vol</span>
                      {getSortIcon('totalVolume')}
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
                    <TableCell className="text-xs sm:text-sm">${formatCurrency(coin.totalVolume)}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{formatNumber(coin.uniqueHolders)}</TableCell>
                  </TableRow>
                ))}
                {currentLoading && (
                  <>
                    {Array.from({ length: 5 }).map((_, index) => (
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
                        <TableCell><Skeleton className="h-3 w-12 sm:h-4 sm:w-16" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
                {!currentLoading && !sortedData.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No creator coins found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          

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
    return price.toFixed(6);
  } else if (price < 1) {
    return price.toFixed(4);
  }
  return price.toFixed(2);
}

function formatNumber(num: number): string {
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatDaysAgo(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays}D`;
  } else {
    return `${diffHours}H`;
  }
}
