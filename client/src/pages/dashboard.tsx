import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Coins } from "lucide-react";
import type { ExchangeRate } from "@shared/schema";

export default function Dashboard() {
  const { data: latestRate, isLoading } = useQuery<ExchangeRate | null>({
    queryKey: ["/api/exchange-rates/latest"],
  });

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString("tr-TR");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground">Güncel döviz ve altın kurları</p>
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
