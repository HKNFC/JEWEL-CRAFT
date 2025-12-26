import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Gem, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GemstonePriceList } from "@shared/schema";

const stoneTypes = [
  "Safir",
  "Zümrüt",
  "Yakut",
  "Ametist",
  "Topaz",
  "Akuamarin",
  "Turmalin",
  "Peridot",
  "Opal",
  "Sitrin",
  "Tanzanit",
  "Morganit",
  "Diğer",
];

const qualities = ["AAA", "AA", "A", "B", "C"];

const gemstoneFormSchema = z.object({
  stoneType: z.string().min(1, "Taş türü gerekli"),
  quality: z.string().optional(),
  minCarat: z.string().optional(),
  maxCarat: z.string().optional(),
  pricePerCarat: z.string().min(1, "Fiyat gerekli"),
});

type GemstoneFormValues = z.infer<typeof gemstoneFormSchema>;

export default function GemstonePricesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: gemstonePrices, isLoading } = useQuery<GemstonePriceList[]>({
    queryKey: ["/api/gemstone-prices"],
  });

  const form = useForm<GemstoneFormValues>({
    resolver: zodResolver(gemstoneFormSchema),
    defaultValues: {
      stoneType: "",
      quality: "",
      minCarat: "",
      maxCarat: "",
      pricePerCarat: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: GemstoneFormValues) => 
      apiRequest("POST", "/api/gemstone-prices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gemstone-prices"] });
      toast({ title: "Taş fiyatı eklendi" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Hata oluştu", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: GemstoneFormValues & { id: number }) => 
      apiRequest("PATCH", `/api/gemstone-prices/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gemstone-prices"] });
      toast({ title: "Taş fiyatı güncellendi" });
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
      apiRequest("DELETE", `/api/gemstone-prices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gemstone-prices"] });
      toast({ title: "Taş fiyatı silindi" });
    },
    onError: () => {
      toast({ title: "Hata oluştu", variant: "destructive" });
    },
  });

  const onSubmit = (data: GemstoneFormValues) => {
    if (editingId) {
      updateMutation.mutate({ ...data, id: editingId });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (gemstone: GemstonePriceList) => {
    setEditingId(gemstone.id);
    form.reset({
      stoneType: gemstone.stoneType,
      quality: gemstone.quality || "",
      minCarat: gemstone.minCarat || "",
      maxCarat: gemstone.maxCarat || "",
      pricePerCarat: gemstone.pricePerCarat,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingId(null);
    form.reset({ stoneType: "", quality: "", minCarat: "", maxCarat: "", pricePerCarat: "" });
    setDialogOpen(true);
  };

  const filteredGemstones = gemstonePrices?.filter(g => 
    g.stoneType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.quality?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-gemstone-prices-title">Taş Fiyatları</h1>
          <p className="text-muted-foreground">Değerli taş fiyatlarını yönetin (Rapaport dışı)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} data-testid="button-add-gemstone">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Taş Fiyatı
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Taş Fiyatını Düzenle" : "Yeni Taş Fiyatı Ekle"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="stoneType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taş Türü *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-stone-type">
                            <SelectValue placeholder="Taş türü seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stoneTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
                  name="quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kalite</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-quality">
                            <SelectValue placeholder="Kalite seçin (opsiyonel)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {qualities.map((q) => (
                            <SelectItem key={q} value={q}>
                              {q}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minCarat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Karat</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="0.10" 
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
                        <FormLabel>Max Karat</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="1.00" 
                            {...field} 
                            data-testid="input-max-carat"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="pricePerCarat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Karat Fiyatı ($) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="100.00" 
                          {...field} 
                          data-testid="input-price-per-carat"
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
                    data-testid="button-cancel-gemstone"
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-gemstone"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Taş türü veya kalite ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
              data-testid="input-search-gemstone"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredGemstones && filteredGemstones.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Taş Türü</TableHead>
                    <TableHead>Kalite</TableHead>
                    <TableHead>Boyut (ct)</TableHead>
                    <TableHead>Karat Fiyatı</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGemstones.map((gemstone) => (
                    <TableRow key={gemstone.id} data-testid={`row-gemstone-${gemstone.id}`}>
                      <TableCell className="font-medium">{gemstone.stoneType}</TableCell>
                      <TableCell>{gemstone.quality || "-"}</TableCell>
                      <TableCell className="font-mono">
                        {gemstone.minCarat && gemstone.maxCarat 
                          ? `${parseFloat(gemstone.minCarat).toFixed(2)} - ${parseFloat(gemstone.maxCarat).toFixed(2)}`
                          : "-"}
                      </TableCell>
                      <TableCell className="font-mono">
                        ${parseFloat(gemstone.pricePerCarat).toFixed(2)}/ct
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(gemstone)}
                            data-testid={`button-edit-gemstone-${gemstone.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                data-testid={`button-delete-gemstone-${gemstone.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Taş Fiyatını Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu taş fiyatını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(gemstone.id)}
                                  data-testid={`button-confirm-delete-gemstone-${gemstone.id}`}
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
              <Gem className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Taş fiyatı bulunamadı</h3>
              <p className="text-sm text-muted-foreground text-center">
                {searchQuery 
                  ? "Arama kriterlerine uygun taş fiyatı yok" 
                  : "Henüz taş fiyatı eklenmemiş. Yeni fiyat ekleyerek başlayın."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
