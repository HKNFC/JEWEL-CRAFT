import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Save, DollarSign, Coins } from "lucide-react";
import type { ExchangeRate } from "@shared/schema";

export default function ExchangeRatesPage() {
  const { toast } = useToast();
  const [manualUsdTry, setManualUsdTry] = useState("");
  const [manualGold24k, setManualGold24k] = useState("");
  const [goldCurrency, setGoldCurrency] = useState<"TRY" | "USD">("TRY");

  const { data: latestRate, isLoading } = useQuery<ExchangeRate | null>({
    queryKey: ["/api/exchange-rates/latest"],
  });

  const fetchMutation = useMutation({
    mutationFn: () => apiRequest("/api/exchange-rates/fetch", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange-rates/latest"] });
      toast({ title: "Kurlar guncellendi", description: "API'den guncel kurlar alindi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Kurlar alinamadi. API anahtarini kontrol edin.", variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: { usdTry: string; gold24kPerGram: string; gold24kCurrency: string; isManual: boolean }) =>
      apiRequest("/api/exchange-rates", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange-rates/latest"] });
      toast({ title: "Kaydedildi", description: "Manuel kurlar kaydedildi" });
      setManualUsdTry("");
      setManualGold24k("");
      setGoldCurrency("TRY");
    },
    onError: () => {
      toast({ title: "Hata", description: "Kurlar kaydedilemedi", variant: "destructive" });
    },
  });

  const handleManualSave = () => {
    if (!manualUsdTry || !manualGold24k) {
      toast({ title: "Hata", description: "Tum alanlari doldurun", variant: "destructive" });
      return;
    }
    saveMutation.mutate({
      usdTry: manualUsdTry,
      gold24kPerGram: manualGold24k,
      gold24kCurrency: goldCurrency,
      isManual: true,
    });
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString("tr-TR");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Doviz ve Altin Kurlari</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg">Guncel Kurlar</CardTitle>
            <Button
              onClick={() => fetchMutation.mutate()}
              disabled={fetchMutation.isPending}
              size="sm"
              data-testid="button-fetch-rates"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${fetchMutation.isPending ? "animate-spin" : ""}`} />
              API'den Guncelle
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">Yukleniyor...</p>
            ) : latestRate ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted rounded-md">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">USD/TRY</p>
                    <p className="text-2xl font-bold" data-testid="text-usd-try">{latestRate.usdTry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-md">
                  <Coins className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">24K Altin ({latestRate.gold24kCurrency || "TRY"}/gram)</p>
                    <p className="text-2xl font-bold" data-testid="text-gold-price">{latestRate.gold24kPerGram} {latestRate.gold24kCurrency || "TRY"}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Son guncelleme: {formatDate(latestRate.updatedAt)}</p>
                  <p>Kaynak: {latestRate.isManual ? "Manuel" : "GoldAPI"}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Henuz kur bilgisi yok. API'den cekin veya manuel girin.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Manuel Kur Girisi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usd-try">USD/TRY Kuru</Label>
              <Input
                id="usd-try"
                type="number"
                step="0.0001"
                placeholder="Ornek: 32.5000"
                value={manualUsdTry}
                onChange={(e) => setManualUsdTry(e.target.value)}
                data-testid="input-usd-try"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gold-24k">24K Altin Fiyati (gram)</Label>
              <div className="flex gap-2">
                <Input
                  id="gold-24k"
                  type="number"
                  step="0.01"
                  placeholder={goldCurrency === "TRY" ? "Ornek: 2450.00" : "Ornek: 75.00"}
                  value={manualGold24k}
                  onChange={(e) => setManualGold24k(e.target.value)}
                  className="flex-1"
                  data-testid="input-gold-24k"
                />
                <Select value={goldCurrency} onValueChange={(v) => setGoldCurrency(v as "TRY" | "USD")}>
                  <SelectTrigger className="w-24" data-testid="select-gold-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">TRY</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleManualSave}
              disabled={saveMutation.isPending}
              className="w-full"
              data-testid="button-save-manual"
            >
              <Save className="h-4 w-4 mr-2" />
              Manuel Kaydet
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
