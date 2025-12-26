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
import type { PolishingPrice } from "@shared/schema";

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

const polishingPriceFormSchema = z.object({
  productType: z.string().min(1, "Urun cinsi secin"),
  pricePerGram: z.string().min(1, "Gram basi fiyat gerekli"),
});

type PolishingPriceFormValues = z.infer<typeof polishingPriceFormSchema>;

export default function PolishingPricesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: polishingPrices, isLoading } = useQuery<PolishingPrice[]>({
    queryKey: ["/api/polishing-prices"],
  });

  const form = useForm<PolishingPriceFormValues>({
    resolver: zodResolver(polishingPriceFormSchema),
    defaultValues: {
      productType: "",
      pricePerGram: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PolishingPriceFormValues) => 
      apiRequest("POST", "/api/polishing-prices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polishing-prices"] });
      toast({ title: "Cila fiyati eklendi" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Hata olustu", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PolishingPriceFormValues & { id: number }) => 
      apiRequest("PATCH", `/api/polishing-prices/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polishing-prices"] });
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
      apiRequest("DELETE", `/api/polishing-prices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polishing-prices"] });
      toast({ title: "Cila fiyati silindi" });
    },
    onError: () => {
      toast({ title: "Hata olustu", variant: "destructive" });
    },
  });

  const onSubmit = (data: PolishingPriceFormValues) => {
    if (editingId) {
      updateMutation.mutate({ ...data, id: editingId });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (price: PolishingPrice) => {
    setEditingId(price.id);
    form.reset({
      productType: price.productType,
      pricePerGram: price.pricePerGram,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingId(null);
    form.reset({ productType: "", pricePerGram: "" });
    setDialogOpen(true);
  };

  const existingProductTypes = polishingPrices?.map(p => p.productType) || [];
  const availableProductTypes = Object.entries(PRODUCT_TYPES).filter(
    ([key]) => !existingProductTypes.includes(key) || (editingId && polishingPrices?.find(p => p.id === editingId)?.productType === key)
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
          <p className="text-muted-foreground mt-1">
            Urun cinsine gore cila fiyatlarini yonetin
          </p>
        </div>
        <Button onClick={openNewDialog} data-testid="button-add-polishing-price">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Cila Fiyati
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cila Fiyat Listesi</CardTitle>
          <CardDescription>
            Her urun cinsi icin gram basi cila fiyatini belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {polishingPrices && polishingPrices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Urun Cinsi</TableHead>
                  <TableHead className="text-right">Fiyat ($/gram)</TableHead>
                  <TableHead className="w-[100px]">Islemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {polishingPrices.map((price) => (
                  <TableRow key={price.id} data-testid={`row-polishing-price-${price.id}`}>
                    <TableCell className="font-medium">
                      {PRODUCT_TYPES[price.productType] || price.productType}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${parseFloat(price.pricePerGram).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(price)}
                          data-testid={`button-edit-polishing-price-${price.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              data-testid={`button-delete-polishing-price-${price.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cila fiyatini sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu cila fiyatini silmek istediginizden emin misiniz?
                                Bu islem geri alinamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Vazgec</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(price.id)}
                                data-testid="button-confirm-delete"
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
              Henuz cila fiyati eklenmemis. Yukaridaki butonu kullanarak yeni bir cila fiyati ekleyin.
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
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
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
                name="pricePerGram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gram Basi Fiyat ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-price-per-gram"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Vazgec
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-polishing-price"
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
