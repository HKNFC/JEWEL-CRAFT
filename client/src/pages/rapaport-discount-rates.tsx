import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { RapaportDiscountRate } from "@shared/schema";

const discountRateFormSchema = z.object({
  minCarat: z.string().min(1, "Minimum karat gerekli"),
  maxCarat: z.string().min(1, "Maksimum karat gerekli"),
  discountPercent: z.string().min(1, "İndirim oranı gerekli"),
});

type DiscountRateFormValues = z.infer<typeof discountRateFormSchema>;

export default function RapaportDiscountRatesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: discountRates, isLoading } = useQuery<RapaportDiscountRate[]>({
    queryKey: ["/api/rapaport-discount-rates"],
  });

  const form = useForm<DiscountRateFormValues>({
    resolver: zodResolver(discountRateFormSchema),
    defaultValues: {
      minCarat: "",
      maxCarat: "",
      discountPercent: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: DiscountRateFormValues) =>
      apiRequest("POST", "/api/rapaport-discount-rates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rapaport-discount-rates"] });
      toast({ title: "İndirim oranı eklendi" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Hata oluştu", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: DiscountRateFormValues & { id: number }) =>
      apiRequest("PATCH", `/api/rapaport-discount-rates/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rapaport-discount-rates"] });
      toast({ title: "İndirim oranı güncellendi" });
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
      apiRequest("DELETE", `/api/rapaport-discount-rates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rapaport-discount-rates"] });
      toast({ title: "İndirim oranı silindi" });
    },
    onError: () => {
      toast({ title: "Hata oluştu", variant: "destructive" });
    },
  });

  const onSubmit = (data: DiscountRateFormValues) => {
    if (editingId) {
      updateMutation.mutate({ ...data, id: editingId });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (rate: RapaportDiscountRate) => {
    setEditingId(rate.id);
    form.reset({
      minCarat: rate.minCarat,
      maxCarat: rate.maxCarat,
      discountPercent: rate.discountPercent,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingId(null);
    form.reset({
      minCarat: "",
      maxCarat: "",
      discountPercent: "",
    });
    setDialogOpen(true);
  };

  const sortedRates = discountRates?.slice().sort((a, b) => 
    parseFloat(a.minCarat) - parseFloat(b.minCarat)
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Rapaport İndirim Oranları
          </h1>
          <p className="text-muted-foreground">
            Karat aralıklarına göre otomatik indirim oranlarını yönetin
          </p>
        </div>
        <Button onClick={openNewDialog} data-testid="button-add-discount-rate">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Oran Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            İndirim Oranları Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sortedRates && sortedRates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Min Karat</TableHead>
                  <TableHead>Max Karat</TableHead>
                  <TableHead>İndirim Oranı (%)</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRates.map((rate) => (
                  <TableRow key={rate.id} data-testid={`row-discount-rate-${rate.id}`}>
                    <TableCell>{rate.minCarat}</TableCell>
                    <TableCell>{rate.maxCarat}</TableCell>
                    <TableCell>{rate.discountPercent}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(rate)}
                          data-testid={`button-edit-${rate.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-delete-${rate.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Silmek istediğinize emin misiniz?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu işlem geri alınamaz. İndirim oranı kalıcı olarak silinecektir.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(rate.id)}
                                data-testid={`button-confirm-delete-${rate.id}`}
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
              Henüz indirim oranı eklenmemiş
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "İndirim Oranını Düzenle" : "Yeni İndirim Oranı Ekle"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="minCarat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Karat</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-min-carat"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxCarat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maksimum Karat</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.99"
                        {...field}
                        data-testid="input-max-carat"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discountPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İndirim Oranı (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="45"
                        {...field}
                        data-testid="input-discount-percent"
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
                  data-testid="button-cancel"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Kaydediliyor..."
                    : editingId
                    ? "Güncelle"
                    : "Ekle"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
