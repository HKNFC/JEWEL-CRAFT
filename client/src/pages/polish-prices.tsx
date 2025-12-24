import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { PolishPrice } from "@shared/schema";

const PRODUCT_TYPES: Record<string, string> = {
  ring: "Yuzuk",
  necklace: "Kolye",
  bracelet: "Bileklik",
  earring: "Kupe",
  brooch: "Bros",
  bangle: "Bilezik",
  chain: "Zincir",
  solitaire: "Tektas",
  fivestone: "Bestas",
  set: "Set",
  other: "Diger",
};

const polishPriceFormSchema = z.object({
  productType: z.string().min(1, "Urun cinsi secin"),
  priceUsd: z.string().min(1, "Fiyat gerekli"),
});

type PolishPriceFormValues = z.infer<typeof polishPriceFormSchema>;

export default function PolishPricesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: polishPrices, isLoading } = useQuery<PolishPrice[]>({
    queryKey: ["/api/polish-prices"],
  });

  const form = useForm<PolishPriceFormValues>({
    resolver: zodResolver(polishPriceFormSchema),
    defaultValues: {
      productType: "",
      priceUsd: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PolishPriceFormValues) => 
      apiRequest("POST", "/api/polish-prices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polish-prices"] });
      toast({ title: "Cila fiyati eklendi" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Hata olustu", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PolishPriceFormValues & { id: number }) => 
      apiRequest("PATCH", `/api/polish-prices/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polish-prices"] });
      toast({ title: "Cila fiyati guncellendi" });
      setDialogOpen(false);
      setEditingId(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Hata olustu", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/polish-prices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polish-prices"] });
      toast({ title: "Cila fiyati silindi" });
    },
    onError: () => {
      toast({ title: "Hata olustu", variant: "destructive" });
    },
  });

  const onSubmit = (data: PolishPriceFormValues) => {
    if (editingId) {
      updateMutation.mutate({ ...data, id: editingId });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (price: PolishPrice) => {
    setEditingId(price.id);
    form.reset({
      productType: price.productType,
      priceUsd: price.priceUsd,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingId(null);
    form.reset({ productType: "", priceUsd: "" });
    setDialogOpen(true);
  };

  const existingProductTypes = polishPrices?.map(p => p.productType) || [];
  const availableProductTypes = Object.entries(PRODUCT_TYPES).filter(
    ([key]) => !existingProductTypes.includes(key) || (editingId && polishPrices?.find(p => p.id === editingId)?.productType === key)
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Cila Fiyatlari
          </h1>
          <p className="text-muted-foreground">
            Urun cinsine gore cila fiyatlarini tanimlayin (USD)
          </p>
        </div>
        <Button onClick={openNewDialog} data-testid="button-add-polish-price">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Fiyat Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tanimli Cila Fiyatlari</CardTitle>
          <CardDescription>
            Her urun cinsi icin sabit cila fiyati (USD)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {polishPrices && polishPrices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Urun Cinsi</TableHead>
                  <TableHead className="text-right">Fiyat (USD)</TableHead>
                  <TableHead className="text-right w-24">Islemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {polishPrices.map((price) => (
                  <TableRow key={price.id} data-testid={`row-polish-price-${price.id}`}>
                    <TableCell className="font-medium">
                      {PRODUCT_TYPES[price.productType] || price.productType}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${parseFloat(price.priceUsd).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(price)}
                          data-testid={`button-edit-polish-price-${price.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-delete-polish-price-${price.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cila fiyatini sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                {PRODUCT_TYPES[price.productType] || price.productType} icin cila fiyatini silmek istediginize emin misiniz?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Iptal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(price.id)}
                                data-testid="button-confirm-delete-polish-price"
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henuz cila fiyati tanimlanmamis</p>
              <p className="text-sm">Yeni fiyat eklemek icin butona tiklayin</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Cila Fiyati Duzenle" : "Yeni Cila Fiyati"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urun Cinsi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-type">
                          <SelectValue placeholder="Urun cinsi secin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableProductTypes.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priceUsd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiyat (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="ornegin: 15.00"
                        {...field}
                        data-testid="input-price-usd"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Iptal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-polish-price"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Kaydediliyor..."
                    : editingId
                    ? "Guncelle"
                    : "Kaydet"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
