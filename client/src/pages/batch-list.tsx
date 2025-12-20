import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { FileText, Package, TrendingUp, TrendingDown, ChevronRight, Calendar, Factory, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { BatchWithRelations } from "@shared/schema";

export default function BatchListPage() {
  const { data: batches, isLoading } = useQuery<BatchWithRelations[]>({
    queryKey: ["/api/batches"],
  });

  const sortedBatches = batches?.slice().sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return b.batchNumber - a.batchNumber;
  }) || [];

  const getBatchStats = (batch: BatchWithRelations) => {
    const records = batch.analysisRecords || [];
    const productCount = records.length;
    const totalAnalysis = records.reduce((sum, r) => sum + parseFloat(r.totalCost || "0"), 0);
    const totalManufacturer = records.reduce((sum, r) => sum + parseFloat(r.manufacturerPrice || "0"), 0);
    const totalDiff = totalManufacturer > 0 && totalAnalysis > 0 
      ? ((totalManufacturer - totalAnalysis) / totalAnalysis) * 100 
      : 0;
    return { productCount, totalAnalysis, totalManufacturer, totalDiff };
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 mb-6">
          <h1 className="text-2xl font-bold">Parti Listesi</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Parti Listesi</h1>
        <Badge variant="outline" className="text-muted-foreground">
          {sortedBatches.length} parti
        </Badge>
      </div>

      {sortedBatches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">Henüz parti bulunmuyor</p>
            <p className="text-sm">Analiz kayıtları oluşturuldukça partiler burada görünecek</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedBatches.map((batch) => {
            const stats = getBatchStats(batch);
            const isPositiveDiff = stats.totalDiff > 0;
            
            return (
              <Link key={batch.id} href={`/batch/${batch.id}`} data-testid={`link-batch-${batch.id}`}>
                <Card className="hover-elevate cursor-pointer transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary/10">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-lg" data-testid={`text-batch-number-${batch.id}`}>
                              Parti #{batch.batchNumber}
                            </span>
                            <Badge variant="secondary" data-testid={`badge-manufacturer-${batch.id}`}>
                              <Factory className="h-3 w-3 mr-1" />
                              {batch.manufacturer?.name || "Bilinmeyen"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(batch.createdAt), "d MMMM yyyy", { locale: tr })}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {stats.productCount} ürün
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Toplam Analiz</p>
                          <p className="font-semibold text-lg" data-testid={`text-total-analysis-${batch.id}`}>
                            ${stats.totalAnalysis.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        
                        {stats.productCount > 0 && stats.totalManufacturer > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Fark</p>
                            <div className={`flex items-center gap-1 font-semibold text-lg ${isPositiveDiff ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                              {isPositiveDiff ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span data-testid={`text-diff-${batch.id}`}>
                                {stats.totalDiff >= 0 ? "+" : ""}{stats.totalDiff.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
