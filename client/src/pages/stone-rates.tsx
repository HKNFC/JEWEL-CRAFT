import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, ListOrdered, Gem, Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { StoneSettingRate } from "@shared/schema";

const stoneRateFormSchema = z.object({
  minCarat: z.string().min(1, "Minimum karat gerekli"),
  maxCarat: z.string().min(1, "Maksimum karat gerekli"),
  pricePerStone: z.string().min(1, "Fiyat gerekli"),
  stoneCategory: z.string(),
  pricingType: z.string().default("per_stone"),
});

type StoneRateFormValues = z.infer<typeof stoneRateFormSchema>;

const PRICING_TYPES = {
  per_stone: "Taş Başına",
  per_carat: "Karat Başına",
};

export default function StoneRatesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"diamond" | "colored">("diamond");

  const { data: stoneRates, isLoading } = useQuery<StoneSettingRate[]>({
    queryKey: ["/api/stone-setting-rates"],
  });

  const form = useForm<StoneRateFormValues>({
    resolver: zodResolver(stoneRateFormSchema),
    defaultValues: {
      minCarat: "",
      maxCarat: "",
      pricePerStone: "",
      stoneCategory: "diamond",
      pricingType: "per_stone",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: StoneRateFormValues) => 
      apiRequest("POST", "/api/stone-setting-rates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stone-setting-rates"] });
      toast({ title: "Mıhlama oranı eklendi" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Hata oluştu", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: StoneRateFormValues & { id: number }) => 
      apiRequest("PATCH", `/api/stone-setting-rates/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stone-setting-rates"] });
      toast({ title: "Mıhlama oranı güncellendi" });
      setDialogOpen(false);
      setEditingId(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Hata oluştu", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/stone-setting-rates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stone-setting-rates"] });
      toast({ title: "Mıhlama oranı silindi" });
    },
    onError: () => {
      toast({ title: "Hata oluştu", variant: "destructive" });
    },
  });

  const onSubmit = (data: StoneRateFormValues) => {
    if (editingId) {
      updateMutation.mutate({ ...data, id: editingId });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (rate: StoneSettingRate) => {
    setEditingId(rate.id);
    form.reset({
      minCarat: rate.minCarat,
      maxCarat: rate.maxCarat,
      pricePerStone: rate.pricePerStone,
      stoneCategory: rate.stoneCategory || "diamond",
      pricingType: rate.pricingType || "per_stone",
    });
    setDialogOpen(true);
  };

  const openNewDialog = (category: "diamond" | "colored") => {
    setEditingId(null);
    form.reset({ minCarat: "", maxCarat: "", pricePerStone: "", stoneCategory: category, pricingType: "per_stone" });
    setDialogOpen(true);
  };

  const diamondRates = stoneRates?.filter(r => r.stoneCategory === "diamond" || !r.stoneCategory) || [];
  const coloredRates = stoneRates?.filter(r => r.stoneCategory === "colored") || [];

  const RatesTable = ({ rates, category }: { rates: StoneSettingRate[], category: string }) => (
    rates.length > 0 ? (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Karat Aralığı</TableHead>
              <TableHead>Fiyatlandırma</TableHead>
              <TableHead>Fiyat</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((rate) => (
              <TableRow key={rate.id} data-testid={`row-stone-rate-${rate.id}`}>
                <TableCell className="font-medium font-mono">
                  {rate.minCarat} - {rate.maxCarat} ct
                </TableCell>
                <TableCell>
                  {PRICING_TYPES[rate.pricingType as keyof typeof PRICING_TYPES] || "Taş Başına"}
                </TableCell>
                <TableCell className="font-mono">
                  ${parseFloat(rate.pricePerStone).toFixed(2)}{rate.pricingType === "per_carat" ? "/ct" : "/adet"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(rate)}
                      data-testid={`button-edit-stone-rate-${rate.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          data-testid={`button-delete-stone-rate-${rate.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Oranı Sil</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu mıhlama oranını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(rate.id)}
                            data-testid={`button-confirm-delete-stone-rate-${rate.id}`}
                          >
                            Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-12">
        <ListOrdered className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Mıhlama oranı bulunamadı</h3>
        <p className="text-sm text-muted-foreground text-center">
          Henüz mıhlama oranı eklenmemiş. Yeni oran ekleyerek başlayın.
        </p>
      </div>
    )
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-stone-rates-title">Mıhlama Listeleri</h1>
        <p className="text-muted-foreground">Pırlanta ve renkli taşlar için ayrı mıhlama fiyatlarını yönetin</p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Oranı Düzenle" : "Yeni Mıhlama Oranı Ekle"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minCarat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min. Karat *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.0001"
                          placeholder="0.01" 
                          {...field} 
                          data-testid="input-min-carat"
                        />
                      </FormControl>
                      <FormDescription>Örn: 0.01</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxCarat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max. Karat *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.0001"
                          placeholder="0.05" 
                          {...field} 
                          data-testid="input-max-carat"
                        />
                      </FormControl>
                      <FormDescription>Örn: 0.05</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="pricingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiyatlandırma Türü *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-pricing-type">
                          <SelectValue placeholder="Fiyatlandırma türü seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="per_stone">Taş Başına</SelectItem>
                        <SelectItem value="per_carat">Karat Başına</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Taş Başına: Her taş için sabit fiyat | Karat Başına: Karat x Fiyat
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pricePerStone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiyat ($) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="5.00" 
                        {...field} 
                        data-testid="input-price-per-stone"
                      />
                    </FormControl>
                    <FormDescription>
                      {form.watch("pricingType") === "per_carat" ? "Karat başına fiyat" : "Taş başına fiyat"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel-stone-rate"
                >
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-stone-rate"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "diamond" | "colored")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="diamond" className="flex items-center gap-2" data-testid="tab-diamond">
            <Diamond className="h-4 w-4" />
            Pırlanta Taş
          </TabsTrigger>
          <TabsTrigger value="colored" className="flex items-center gap-2" data-testid="tab-colored">
            <Gem className="h-4 w-4" />
            Renkli Taş
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diamond" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
              <CardTitle className="text-lg">Pırlanta Taş Mıhlama Listesi</CardTitle>
              <Button onClick={() => openNewDialog("diamond")} data-testid="button-add-diamond-rate">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Oran
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <RatesTable rates={diamondRates} category="diamond" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colored" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
              <CardTitle className="text-lg">Renkli Taş Mıhlama Listesi</CardTitle>
              <Button onClick={() => openNewDialog("colored")} data-testid="button-add-colored-rate">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Oran
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <RatesTable rates={coloredRates} category="colored" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
