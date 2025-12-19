import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, FileText, Search, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import type { AnalysisRecordWithRelations, Manufacturer, StoneSettingRate, GemstonePriceList, AnalysisStone } from "@shared/schema";

const analysisFormSchema = z.object({
  manufacturerId: z.string().min(1, "Üretici seçiniz"),
  productCode: z.string().min(1, "Ürün kodu gerekli"),
  totalGrams: z.string().min(1, "Toplam gram gerekli"),
  goldLaborCost: z.string().optional(),
  goldLaborType: z.string().default("dollar"),
  firePercentage: z.string().optional(),
  polishAmount: z.string().optional(),
  certificateAmount: z.string().optional(),
});

const stoneFormSchema = z.object({
  stoneType: z.string().min(1, "Taş türü gerekli"),
  caratSize: z.string().min(1, "Karat boyutu gerekli"),
  quantity: z.string().min(1, "Adet gerekli"),
  shape: z.string().optional(),
  color: z.string().optional(),
  clarity: z.string().optional(),
  discountPercent: z.string().optional(),
});

type AnalysisFormValues = z.infer<typeof analysisFormSchema>;
type StoneFormValues = z.infer<typeof stoneFormSchema>;

const DIAMOND_SHAPES = ["Round", "Princess", "Cushion", "Oval", "Emerald", "Pear", "Marquise", "Radiant", "Asscher", "Heart"];
const DIAMOND_COLORS = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
const DIAMOND_CLARITIES = ["IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3"];

interface StoneEntry {
  stoneType: string;
  caratSize: string;
  quantity: number;
  pricePerCarat?: number;
  settingCost?: number;
  totalStoneCost?: number;
  shape?: string;
  color?: string;
  clarity?: string;
  rapaportPrice?: number;
  discountPercent?: number;
}

export default function AnalysisPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stones, setStones] = useState<StoneEntry[]>([]);
  const [stoneDialogOpen, setStoneDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecordWithRelations | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [fireValue, setFireValue] = useState([0]);

  const { data: analysisRecords, isLoading } = useQuery<AnalysisRecordWithRelations[]>({
    queryKey: ["/api/analysis-records"],
  });

  const { data: manufacturers } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });

  const { data: stoneRates } = useQuery<StoneSettingRate[]>({
    queryKey: ["/api/stone-setting-rates"],
  });

  const { data: gemstonePrices } = useQuery<GemstonePriceList[]>({
    queryKey: ["/api/gemstone-prices"],
  });

  const form = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: {
      manufacturerId: "",
      productCode: "",
      totalGrams: "",
      goldLaborCost: "",
      goldLaborType: "dollar",
      firePercentage: "0",
      polishAmount: "",
      certificateAmount: "",
    },
  });

  const stoneForm = useForm<StoneFormValues>({
    resolver: zodResolver(stoneFormSchema),
    defaultValues: {
      stoneType: "",
      caratSize: "",
      quantity: "1",
      shape: "",
      color: "",
      clarity: "",
      discountPercent: "",
    },
  });

  const lookupRapaportPrice = async (shape: string, carat: number, color: string, clarity: string): Promise<number | null> => {
    try {
      const response = await fetch(`/api/rapaport-prices/lookup?shape=${encodeURIComponent(shape)}&carat=${carat}&color=${encodeURIComponent(color)}&clarity=${encodeURIComponent(clarity)}`);
      if (response.ok) {
        const data = await response.json();
        return data?.pricePerCarat ? parseFloat(data.pricePerCarat) : null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: { record: AnalysisFormValues; stones: StoneEntry[] }) => 
      apiRequest("POST", "/api/analysis-records", { ...data.record, stones: data.stones }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis-records"] });
      toast({ title: "Analiz kaydı oluşturuldu" });
      setDialogOpen(false);
      form.reset();
      setStones([]);
      setFireValue([0]);
    },
    onError: () => {
      toast({ title: "Hata oluştu", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; record: AnalysisFormValues; stones: StoneEntry[] }) => 
      apiRequest("PATCH", `/api/analysis-records/${data.id}`, { ...data.record, stones: data.stones }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis-records"] });
      toast({ title: "Analiz kaydı güncellendi" });
      setDialogOpen(false);
      setEditingId(null);
      form.reset();
      setStones([]);
      setFireValue([0]);
    },
    onError: () => {
      toast({ title: "Hata oluştu", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/analysis-records/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis-records"] });
      toast({ title: "Analiz kaydı silindi" });
    },
    onError: () => {
      toast({ title: "Hata oluştu", variant: "destructive" });
    },
  });

  const onSubmit = (data: AnalysisFormValues) => {
    const formData = { ...data, firePercentage: fireValue[0].toString() };
    if (editingId) {
      updateMutation.mutate({ id: editingId, record: formData, stones });
    } else {
      createMutation.mutate({ record: formData, stones });
    }
  };

  const addStone = async (data: StoneFormValues) => {
    const gemstone = gemstonePrices?.find(g => g.stoneType === data.stoneType);
    const caratSize = parseFloat(data.caratSize);
    const settingRate = stoneRates?.find(r => 
      caratSize >= parseFloat(r.minCarat) && caratSize <= parseFloat(r.maxCarat)
    );

    const settingCost = settingRate ? parseFloat(settingRate.pricePerStone) * parseInt(data.quantity) : 0;
    const discountPercent = data.discountPercent ? parseFloat(data.discountPercent) : 0;
    
    let pricePerCarat = gemstone ? parseFloat(gemstone.pricePerCarat) : 0;
    let rapaportPrice: number | undefined = undefined;
    let totalStoneCost = 0;

    const isDiamond = data.stoneType.toLowerCase().includes("elmas") || 
                      data.stoneType.toLowerCase().includes("diamond") ||
                      data.stoneType.toLowerCase().includes("pırlanta");

    if (isDiamond && data.shape && data.color && data.clarity) {
      const rapPrice = await lookupRapaportPrice(data.shape, caratSize, data.color, data.clarity);
      if (rapPrice) {
        rapaportPrice = rapPrice;
        const discountedPrice = rapPrice * (1 - discountPercent / 100);
        totalStoneCost = (discountedPrice * caratSize * parseInt(data.quantity)) + settingCost;
      } else {
        totalStoneCost = (pricePerCarat * caratSize * parseInt(data.quantity)) + settingCost;
        toast({ title: "Rapaport fiyatı bulunamadı, standart fiyat kullanıldı", variant: "default" });
      }
    } else {
      totalStoneCost = (pricePerCarat * caratSize * parseInt(data.quantity)) + settingCost;
    }

    setStones([...stones, {
      stoneType: data.stoneType,
      caratSize: data.caratSize,
      quantity: parseInt(data.quantity),
      pricePerCarat,
      settingCost,
      totalStoneCost,
      shape: data.shape || undefined,
      color: data.color || undefined,
      clarity: data.clarity || undefined,
      rapaportPrice,
      discountPercent: discountPercent || undefined,
    }]);
    stoneForm.reset();
    setStoneDialogOpen(false);
  };

  const removeStone = (index: number) => {
    setStones(stones.filter((_, i) => i !== index));
  };

  const openEditDialog = (record: AnalysisRecordWithRelations) => {
    setEditingId(record.id);
    form.reset({
      manufacturerId: record.manufacturerId?.toString() || "",
      productCode: record.productCode,
      totalGrams: record.totalGrams,
      goldLaborCost: record.goldLaborCost || "",
      goldLaborType: record.goldLaborType || "dollar",
      firePercentage: record.firePercentage || "0",
      polishAmount: record.polishAmount || "",
      certificateAmount: record.certificateAmount || "",
    });
    setFireValue([parseFloat(record.firePercentage || "0")]);
    setStones(record.stones?.map(s => ({
      stoneType: s.stoneType,
      caratSize: s.caratSize,
      quantity: s.quantity,
      pricePerCarat: s.pricePerCarat ? parseFloat(s.pricePerCarat) : undefined,
      settingCost: s.settingCost ? parseFloat(s.settingCost) : undefined,
      totalStoneCost: s.totalStoneCost ? parseFloat(s.totalStoneCost) : undefined,
      shape: s.shape || undefined,
      color: s.color || undefined,
      clarity: s.clarity || undefined,
      rapaportPrice: s.rapaportPrice ? parseFloat(s.rapaportPrice) : undefined,
      discountPercent: s.discountPercent ? parseFloat(s.discountPercent) : undefined,
    })) || []);
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingId(null);
    form.reset();
    setStones([]);
    setFireValue([0]);
    setDialogOpen(true);
  };

  const viewRecord = (record: AnalysisRecordWithRelations) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const toggleRowExpand = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredRecords = analysisRecords?.filter(r => 
    r.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.manufacturer?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStoneCost = stones.reduce((sum, s) => sum + (s.totalStoneCost || 0), 0);

  const stoneTypes = gemstonePrices?.map(g => g.stoneType).filter((v, i, a) => a.indexOf(v) === i) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-analysis-title">Analiz Kayıtları</h1>
          <p className="text-muted-foreground">Mücevher maliyet analizi yapın</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} data-testid="button-add-analysis">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Analiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Analizi Düzenle" : "Yeni Maliyet Analizi"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Temel Bilgiler</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="manufacturerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Üretici *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-manufacturer">
                                <SelectValue placeholder="Üretici seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {manufacturers?.map((m) => (
                                <SelectItem key={m.id} value={m.id.toString()}>
                                  {m.name}
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
                      name="productCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ürün Kodu *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ABC-123" 
                              {...field} 
                              data-testid="input-product-code"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="totalGrams"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Toplam Gram *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.001"
                              placeholder="10.500" 
                              {...field} 
                              data-testid="input-total-grams"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="goldLaborCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Altın İşçiliği</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.01"
                                placeholder="50.00" 
                                {...field} 
                                data-testid="input-gold-labor"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="goldLaborType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Birim</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-labor-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="dollar">$ (Dolar)</SelectItem>
                                <SelectItem value="gold">Altın (gr)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Ek Maliyetler</h3>
                  <FormField
                    control={form.control}
                    name="firePercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fire Oranı: {fireValue[0]}%</FormLabel>
                        <FormControl>
                          <Slider
                            value={fireValue}
                            onValueChange={setFireValue}
                            max={20}
                            step={0.5}
                            className="py-2"
                            data-testid="slider-fire-percentage"
                          />
                        </FormControl>
                        <FormDescription>Üretim sırasında oluşan fire oranı</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="polishAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cila Tutarı ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="0.00" 
                              {...field} 
                              data-testid="input-polish"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="certificateAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sertifika Tutarı ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="0.00" 
                              {...field} 
                              data-testid="input-certificate"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-muted-foreground">Taşlar</h3>
                    <Dialog open={stoneDialogOpen} onOpenChange={setStoneDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" size="sm" variant="outline" data-testid="button-add-stone">
                          <Plus className="h-4 w-4 mr-1" />
                          Taş Ekle
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Taş Ekle</DialogTitle>
                        </DialogHeader>
                        <Form {...stoneForm}>
                          <form onSubmit={stoneForm.handleSubmit(addStone)} className="space-y-4">
                            <FormField
                              control={stoneForm.control}
                              name="stoneType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Taş Türü *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-add-stone-type">
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
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={stoneForm.control}
                                name="caratSize"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Karat Boyutu *</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number"
                                        step="0.0001"
                                        placeholder="0.05" 
                                        {...field} 
                                        data-testid="input-stone-carat"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={stoneForm.control}
                                name="quantity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Adet *</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number"
                                        min="1"
                                        placeholder="1" 
                                        {...field} 
                                        data-testid="input-stone-quantity"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="border-t pt-4 mt-2">
                              <p className="text-sm text-muted-foreground mb-3">Pırlanta/Elmas için Rapaport Fiyatlandırma</p>
                              <div className="grid grid-cols-3 gap-3">
                                <FormField
                                  control={stoneForm.control}
                                  name="shape"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Kesim</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-stone-shape">
                                            <SelectValue placeholder="Seçin" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {DIAMOND_SHAPES.map((shape) => (
                                            <SelectItem key={shape} value={shape}>
                                              {shape}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={stoneForm.control}
                                  name="color"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Renk</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-stone-color">
                                            <SelectValue placeholder="Seçin" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {DIAMOND_COLORS.map((color) => (
                                            <SelectItem key={color} value={color}>
                                              {color}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={stoneForm.control}
                                  name="clarity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Berraklık</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-stone-clarity">
                                            <SelectValue placeholder="Seçin" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {DIAMOND_CLARITIES.map((clarity) => (
                                            <SelectItem key={clarity} value={clarity}>
                                              {clarity}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="mt-3">
                                <FormField
                                  control={stoneForm.control}
                                  name="discountPercent"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>İskonto Oranı (%)</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          max="100"
                                          placeholder="0" 
                                          {...field} 
                                          data-testid="input-stone-discount"
                                        />
                                      </FormControl>
                                      <FormDescription>Rapaport fiyatından uygulanacak iskonto</FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setStoneDialogOpen(false)}>
                                İptal
                              </Button>
                              <Button type="submit" data-testid="button-confirm-add-stone">
                                Ekle
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {stones.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Taş</TableHead>
                            <TableHead>Karat</TableHead>
                            <TableHead>Adet</TableHead>
                            <TableHead>Rapaport</TableHead>
                            <TableHead>İskonto</TableHead>
                            <TableHead>Maliyet</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stones.map((stone, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div>{stone.stoneType}</div>
                                {stone.shape && (
                                  <div className="text-xs text-muted-foreground">
                                    {stone.shape} {stone.color}/{stone.clarity}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-mono">{stone.caratSize} ct</TableCell>
                              <TableCell>{stone.quantity}</TableCell>
                              <TableCell className="font-mono text-sm">
                                {stone.rapaportPrice ? `$${stone.rapaportPrice.toFixed(0)}/ct` : "-"}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {stone.discountPercent ? `${stone.discountPercent}%` : "-"}
                              </TableCell>
                              <TableCell className="font-mono font-medium">
                                ${stone.totalStoneCost?.toFixed(2) || "0.00"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeStone(index)}
                                  data-testid={`button-remove-stone-${index}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="p-3 bg-muted/50 text-right font-medium">
                        Toplam Taş Maliyeti: ${totalStoneCost.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm border rounded-md border-dashed">
                      Henüz taş eklenmedi
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    data-testid="button-cancel-analysis"
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-analysis"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Analiz Detayları</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Üretici</p>
                  <p className="font-medium">{selectedRecord.manufacturer?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ürün Kodu</p>
                  <p className="font-medium">{selectedRecord.productCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Gram</p>
                  <p className="font-medium font-mono">{selectedRecord.totalGrams} gr</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Altın İşçiliği</p>
                  <p className="font-medium font-mono">
                    {selectedRecord.goldLaborCost || "0"} 
                    {selectedRecord.goldLaborType === "gold" ? " gr" : " $"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fire</p>
                  <p className="font-medium">{selectedRecord.firePercentage || "0"}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cila</p>
                  <p className="font-medium font-mono">${selectedRecord.polishAmount || "0"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sertifika</p>
                  <p className="font-medium font-mono">${selectedRecord.certificateAmount || "0"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Maliyet</p>
                  <p className="font-bold text-lg font-mono">${selectedRecord.totalCost || "0"}</p>
                </div>
              </div>

              {selectedRecord.stones && selectedRecord.stones.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Taşlar</p>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Taş</TableHead>
                          <TableHead>Karat</TableHead>
                          <TableHead>Adet</TableHead>
                          <TableHead>Rapaport</TableHead>
                          <TableHead>İskonto</TableHead>
                          <TableHead>Maliyet</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRecord.stones.map((stone) => (
                          <TableRow key={stone.id}>
                            <TableCell>{stone.stoneType}</TableCell>
                            <TableCell className="font-mono">{stone.caratSize} ct</TableCell>
                            <TableCell>{stone.quantity}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {stone.rapaportPrice ? `$${parseFloat(stone.rapaportPrice).toFixed(0)}/ct` : "-"}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {stone.discountPercent ? `${stone.discountPercent}%` : "-"}
                            </TableCell>
                            <TableCell className="font-mono">${stone.totalStoneCost || "0"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ürün kodu veya üretici ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
              data-testid="input-search-analysis"
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
          ) : filteredRecords && filteredRecords.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Ürün Kodu</TableHead>
                    <TableHead>Üretici</TableHead>
                    <TableHead>Gram</TableHead>
                    <TableHead>Taş Sayısı</TableHead>
                    <TableHead>Toplam Maliyet</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <>
                      <TableRow key={record.id} data-testid={`row-analysis-${record.id}`}>
                        <TableCell>
                          {record.stones && record.stones.length > 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => toggleRowExpand(record.id)}
                              data-testid={`button-expand-${record.id}`}
                            >
                              {expandedRows.has(record.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="font-medium font-mono">{record.productCode}</TableCell>
                        <TableCell>{record.manufacturer?.name || "-"}</TableCell>
                        <TableCell className="font-mono">{record.totalGrams} gr</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {record.stones?.length || 0} taş
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          ${parseFloat(record.totalCost || "0").toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => viewRecord(record)}
                              data-testid={`button-view-analysis-${record.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditDialog(record)}
                              data-testid={`button-edit-analysis-${record.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  data-testid={`button-delete-analysis-${record.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Analizi Sil</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bu analiz kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>İptal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(record.id)}
                                    data-testid={`button-confirm-delete-analysis-${record.id}`}
                                  >
                                    Sil
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(record.id) && record.stones && record.stones.length > 0 && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={7} className="p-4">
                            <div className="rounded-md border bg-background">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Taş Türü</TableHead>
                                    <TableHead>Karat</TableHead>
                                    <TableHead>Adet</TableHead>
                                    <TableHead>Fiyat/ct</TableHead>
                                    <TableHead>Mıhlama</TableHead>
                                    <TableHead>Toplam</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {record.stones.map((stone) => (
                                    <TableRow key={stone.id}>
                                      <TableCell>{stone.stoneType}</TableCell>
                                      <TableCell className="font-mono">{stone.caratSize} ct</TableCell>
                                      <TableCell>{stone.quantity}</TableCell>
                                      <TableCell className="font-mono">${stone.pricePerCarat || "0"}</TableCell>
                                      <TableCell className="font-mono">${stone.settingCost || "0"}</TableCell>
                                      <TableCell className="font-mono font-medium">${stone.totalStoneCost || "0"}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Analiz kaydı bulunamadı</h3>
              <p className="text-sm text-muted-foreground text-center">
                {searchQuery 
                  ? "Arama kriterlerine uygun kayıt yok" 
                  : "Henüz analiz kaydı oluşturulmamış. Yeni analiz ekleyerek başlayın."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
