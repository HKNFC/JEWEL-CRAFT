import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Factory, Gem, ListOrdered, FileText, TrendingUp, DollarSign } from "lucide-react";
import type { Manufacturer, StoneSettingRate, GemstonePriceList, AnalysisRecord } from "@shared/schema";

export default function Dashboard() {
  const { data: manufacturers, isLoading: loadingManufacturers } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });

  const { data: stoneRates, isLoading: loadingRates } = useQuery<StoneSettingRate[]>({
    queryKey: ["/api/stone-setting-rates"],
  });

  const { data: gemstonePrices, isLoading: loadingPrices } = useQuery<GemstonePriceList[]>({
    queryKey: ["/api/gemstone-prices"],
  });

  const { data: analysisRecords, isLoading: loadingAnalysis } = useQuery<AnalysisRecord[]>({
    queryKey: ["/api/analysis-records"],
  });

  const isLoading = loadingManufacturers || loadingRates || loadingPrices || loadingAnalysis;

  const totalCost = analysisRecords?.reduce((sum, record) => {
    return sum + (parseFloat(record.totalCost || "0"));
  }, 0) || 0;

  const avgCost = analysisRecords?.length 
    ? totalCost / analysisRecords.length 
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground">Mücevher maliyet analizi özeti</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Üreticiler</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-manufacturer-count">
                {manufacturers?.length || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Kayıtlı üretici sayısı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mıhlama Oranları</CardTitle>
            <ListOrdered className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-rate-count">
                {stoneRates?.length || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Tanımlı fiyat aralığı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taş Fiyatları</CardTitle>
            <Gem className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-gemstone-count">
                {gemstonePrices?.length || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Kayıtlı taş türü</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analiz Kayıtları</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-analysis-count">
                {analysisRecords?.length || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Toplam analiz</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Maliyet</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-cost">
                ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Tüm analizlerin toplam maliyeti</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Maliyet</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-avg-cost">
                ${avgCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Analiz başına ortalama maliyet</p>
          </CardContent>
        </Card>
      </div>

      {(!analysisRecords || analysisRecords.length === 0) && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Henüz analiz kaydı yok</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Maliyet analizi yapmak için önce üreticileri, mıhlama oranlarını ve taş fiyatlarını tanımlayın.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
