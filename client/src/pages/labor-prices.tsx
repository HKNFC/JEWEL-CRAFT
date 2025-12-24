import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Hammer } from "lucide-react";
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
import type { LaborPrice } from "@shared/schema";

const PRODUCT_TYPES: Record<string, string> = {
  ring: "Yüzük",
  necklace: "Kolye",
  bracelet: "Bileklik",
  earring: "Küpe",
  brooch: "Broş",
  bangle: "Bilezik",
  chain: "Zincir",
  solitaire: "Tektaş",
  fivestone: "Beştaş",
  set: "Set",
  other: "Diğer",
};

const laborPriceFormSchema = z.object({
  productType: z.string().min(1, "Urun cinsi secin"),
  pricePerGram: z.string().min(1, "Gram fiyati gerekli"),
});

type LaborPriceFormValues = z.infer<typeof laborPriceFormSchema>;

export default function LaborPricesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: laborPrices, isLoading } = useQuery<LaborPrice[]>({
    queryKey: ["/api/labor-prices"],
  });

  const form = useForm<LaborPriceFormValues>({
    resolver: zodResolver(laborPriceFormSchema),
    defaultValues: {
      productType: "",
      pricePerGram: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: LaborPriceFormValues) => 
      apiRequest("POST", "/api/labor-prices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/labor-prices"] });
      toast({ title: "Iscilik fiyati eklendi" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Hata olustu", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: LaborPriceFormValues & { id: number }) => 
      apiRequest("PATCH", `/api/labor-prices/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/labor-prices"] });
      toast({ title: "Iscilik fiyati guncellendi" });
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
      apiRequest("DELETE", `/api/labor-prices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/labor-prices"] });
      toast({ title: "Iscilik fiyati silindi" });
    },
    onError: () => {
      toast({ title: "Hata olustu", variant: "destructive" });
    },
  });

  const onSubmit = (data: LaborPriceFormValues) => {
    if (editingId) {
      updateMutation.mutate({ ...data, id: editingId });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (price: LaborPrice) => {
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

  const existingProductTypes = laborPrices?.map(p => p.productType) || [];
  const availableProductTypes = Object.entries(PRODUCT_TYPES).filter(
    ([key]) => !existingProductTypes.includes(key) || (editingId && laborPrices?.find(p => p.id === editingId)?.productType === key)
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
            <Hammer className="h-6 w-6" />
            Iscilik Fiyatlari
          </h1>
          <p className="text-muted-foreground">
            Urun cinsine gore iscilik fiyatlarini tanimlayin ($/gram)
          </p>
        </div>
        <Button onClick={openNewDialog} data-testid="button-add-labor-price">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Fiyat Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tanimli Iscilik Fiyatlari</CardTitle>
          <CardDescription>
            Analiz sirasinda urun cinsine gore iscilik otomatik hesaplanir
          </CardDescription>
        </CardHeader>
        <CardContent>
          {laborPrices && laborPrices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Urun Cinsi</TableHead>
                  <TableHead className="text-right">Fiyat ($/gram)</TableHead>
                  <TableHead className="text-right w-24">Islemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laborPrices.map((price) => (
                  <TableRow key={price.id} data-testid={`row-labor-price-${price.id}`}>
                    <TableCell className="font-medium">
                      {PRODUCT_TYPES[price.productType] || price.productType}
                    </TableCell>
                    <TableCell className="text-right">
                      ${parseFloat(price.pricePerGram).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(price)}
                          data-testid={`button-edit-labor-price-${price.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-delete-labor-price-${price.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Silmek istediginize emin misiniz?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {PRODUCT_TYPES[price.productType]} iscilik fiyati silinecek.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Iptal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(price.id)}
                                data-testid={`button-confirm-delete-${price.id}`}
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
            <p className="text-muted-foreground text-center py-8">
              Henuz iscilik fiyati tanimlanmamis. Yeni fiyat eklemek icin butona tiklayin.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Iscilik Fiyati Duzenle" : "Yeni Iscilik Fiyati"}
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
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!!editingId}
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
                    <FormLabel>Gram Fiyati ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-price-per-gram"
                        {...field}
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
                  data-testid="button-save-labor-price"
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
