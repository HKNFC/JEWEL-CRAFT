import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Coins, Sparkles, TrendingUp } from "lucide-react";
import type { ExchangeRate, User } from "@shared/schema";

export default function Dashboard() {
  const { data: latestRate, isLoading } = useQuery<ExchangeRate | null>({
    queryKey: ["/api/exchange-rates/latest"],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString("tr-TR");
  };

  const getTitle = () => {
    if (!currentUser?.fullName) return "";
    const firstName = currentUser.fullName.split(" ")[0];
    const title = currentUser.gender === "female" ? "Hn." : "Bey";
    return `Sayın ${firstName} ${title}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-amber-500/90 via-amber-600/85 to-yellow-600/90 dark:from-amber-600/80 dark:via-amber-700/75 dark:to-yellow-700/80 p-6 shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-20">
          <Sparkles className="w-full h-full text-white" />
        </div>
        <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 opacity-10">
          <TrendingUp className="w-full h-full text-white" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-gray-900/60 rounded-full" />
            <h2 className="text-xl font-bold text-gray-900 drop-shadow-sm" data-testid="text-welcome-title">
              {getTitle()}
            </h2>
          </div>
          <p className="text-gray-900/90 leading-relaxed text-sm md:text-base max-w-2xl pl-3" data-testid="text-motivation-message">
            <span className="font-bold">Güven kontrolle başlar.</span> Analizlerinizdeki titizlik, üreticilerimizle olan bağımızı daha şeffaf ve karlı hale getirecek. Analizdeki her saniye, gelecekte kazanılacak binlerce dolardır.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">USD/TRY Kuru</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : latestRate ? (
              <div className="text-2xl font-bold" data-testid="text-usd-try">
                {latestRate.usdTry} TRY
              </div>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">-</div>
            )}
            <p className="text-xs text-muted-foreground">
              {latestRate ? `Son güncelleme: ${formatDate(latestRate.updatedAt)}` : "Henüz kur bilgisi yok"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24K Altın Fiyatı</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : latestRate ? (
              <div className="text-2xl font-bold" data-testid="text-gold-price">
                {latestRate.gold24kPerGram} {latestRate.gold24kCurrency || "TRY"}/gram
              </div>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">-</div>
            )}
            <p className="text-xs text-muted-foreground">
              {latestRate ? `Kaynak: ${latestRate.isManual ? "Manuel" : "GoldAPI"}` : "Döviz/Altın sayfasından girin"}
            </p>
          </CardContent>
        </Card>
      </div>

      {!latestRate && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Coins className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Henüz kur bilgisi yok</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Döviz/Altın sayfasından güncel kurları girebilir veya API'den çekebilirsiniz.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
