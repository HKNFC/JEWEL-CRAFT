import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Flame } from "lucide-react";
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
import type { PolishFirePrice } from "@shared/schema";

const PRODUCT_TYPES: Record<string, string> = {
  ring: "Yuzuk",
  necklace: "Kolye",
  pendant: "Kolye Ucu",
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

const polishFirePriceFormSchema = z.object({
  productType: z.string().min(1, "Urun cinsi secin"),
  fireRateUsd: z.string().min(1, "Fire orani gerekli"),
});

type PolishFirePriceFormValues = z.infer<typeof polishFirePriceFormSchema>;

export default function PolishFirePricesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: polishFirePrices, isLoading } = useQuery<PolishFirePrice[]>({
    queryKey: ["/api/polish-fire-prices"],
  });

  const form = useForm<PolishFirePriceFormValues>({
    resolver: zodResolver(polishFirePriceFormSchema),
    defaultValues: {
      productType: "",
      fireRateUsd: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PolishFirePriceFormValues) => 
      apiRequest("POST", "/api/polish-fire-prices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polish-fire-prices"] });
      toast({ title: "Cila fire fiyati eklendi" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Hata olustu", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PolishFirePriceFormValues & { id: number }) => 
      apiRequest("PATCH", `/api/polish-fire-prices/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polish-fire-prices"] });
      toast({ title: "Cila fire fiyati guncellendi" });
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
      apiRequest("DELETE", `/api/polish-fire-prices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polish-fire-prices"] });
      toast({ title: "Cila fire fiyati silindi" });
    },
    onError: () => {
      toast({ title: "Hata olustu", variant: "destructive" });
    },
  });

  const onSubmit = (data: PolishFirePriceFormValues) => {
    if (editingId) {
      updateMutation.mutate({ ...data, id: editingId });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (price: PolishFirePrice) => {
    setEditingId(price.id);
    form.reset({
      productType: price.productType,
      fireRateUsd: price.fireRateUsd,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingId(null);
    form.reset({ productType: "", fireRateUsd: "" });
    setDialogOpen(true);
  };

  const existingProductTypes = polishFirePrices?.map(p => p.productType) || [];
  const availableProductTypes = Object.entries(PRODUCT_TYPES).filter(
    ([key]) => !existingProductTypes.includes(key) || (editingId && polishFirePrices?.find(p => p.id === editingId)?.productType === key)
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
            <Flame className="h-6 w-6" />
            Cila Fire Fiyatlari
          </h1>
          <p className="text-muted-foreground">
            Urun cinsine gore cila fire oranlarini tanimlayin (USD)
          </p>
        </div>
        <Button onClick={openNewDialog} data-testid="button-add-polish-fire-price">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Fire Orani Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tanimli Cila Fire Oranlari</CardTitle>
          <CardDescription>
            Her urun cinsi icin cila fire orani (USD)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {polishFirePrices && polishFirePrices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Urun Cinsi</TableHead>
                  <TableHead className="text-right">Fire Orani (USD)</TableHead>
                  <TableHead className="text-right w-24">Islemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {polishFirePrices.map((price) => (
                  <TableRow key={price.id} data-testid={`row-polish-fire-price-${price.id}`}>
                    <TableCell className="font-medium">
                      {PRODUCT_TYPES[price.productType] || price.productType}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${parseFloat(price.fireRateUsd).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(price)}
                          data-testid={`button-edit-polish-fire-price-${price.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-delete-polish-fire-price-${price.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cila fire fiyatini sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu cila fire fiyatini silmek istediginizden emin misiniz?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Iptal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(price.id)}
                                data-testid={`button-confirm-delete-polish-fire-price-${price.id}`}
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
              Henuz cila fire fiyati tanimlanmamis.
              <br />
              Yeni bir fire orani eklemek icin butonu kullanin.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Cila Fire Fiyati Duzenle" : "Yeni Cila Fire Fiyati"}
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
                name="fireRateUsd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fire Orani (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-fire-rate-usd"
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
                  data-testid="button-submit-polish-fire-price"
                >
                  {editingId ? "Guncelle" : "Ekle"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
