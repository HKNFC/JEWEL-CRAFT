import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, FileText, Search, Eye, ChevronDown, ChevronUp, Pencil, X, Save } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { AnalysisRecordWithRelations, Manufacturer, StoneSettingRate, GemstonePriceList } from "@shared/schema";

const analysisFormSchema = z.object({
  manufacturerId: z.string().min(1, "Üretici seçiniz"),
  productCode: z.string().min(1, "Ürün kodu gerekli"),
  totalGrams: z.string().min(1, "Toplam gram gerekli"),
  goldLaborCost: z.string().optional(),
  goldLaborType: z.string().default("dollar"),
  firePercentage: z.string().optional(),
  polishAmount: z.string().optional(),
  certificateAmount: z.string().optional(),
  manufacturerPrice: z.string().optional(),
});

type AnalysisFormValues = z.infer<typeof analysisFormSchema>;

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
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stones, setStones] = useState<StoneEntry[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecordWithRelations | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [fireValue, setFireValue] = useState([0]);
  const [polishEnabled, setPolishEnabled] = useState(false);

  interface ExchangeRates {
    usdTry: string;
    gold24kPerGram: string;
    gold24kCurrency: string;
  }

  const { data: exchangeRates } = useQuery<ExchangeRates>({
    queryKey: ["/api/exchange-rates"],
  });

  const goldPricePerGram = exchangeRates ? parseFloat(exchangeRates.gold24kPerGram) : 0;
  const usdTryRate = exchangeRates ? parseFloat(exchangeRates.usdTry) : 1;

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
      manufacturerPrice: "",
    },
  });

  const calculateCosts = () => {
    const safeNumber = (val: number) => (isNaN(val) || !isFinite(val)) ? 0 : val;
    
    const totalGrams = safeNumber(parseFloat(form.watch("totalGrams") || "0"));
    const firePercentage = safeNumber(fireValue[0]);
    const goldLaborCost = safeNumber(parseFloat(form.watch("goldLaborCost") || "0"));
    const goldLaborType = form.watch("goldLaborType");
    const polishAmount = polishEnabled ? safeNumber(parseFloat(form.watch("polishAmount") || "0")) : 0;
    const certificateAmount = safeNumber(parseFloat(form.watch("certificateAmount") || "0"));
    const manufacturerPrice = safeNumber(parseFloat(form.watch("manufacturerPrice") || "0"));

    const rawMaterialCost = safeNumber(totalGrams * (1 + firePercentage / 100) * goldPricePerGram);

    let laborCost = 0;
    if (goldLaborType === "gold") {
      laborCost = safeNumber(goldLaborCost * goldPricePerGram);
    } else {
      laborCost = safeNumber(goldLaborCost * usdTryRate);
    }
    laborCost += safeNumber((polishAmount * usdTryRate) + (certificateAmount * usdTryRate));

    const totalSettingCost = safeNumber(stones.reduce((sum, s) => sum + (s.settingCost || 0), 0) * usdTryRate);
    const totalStoneCostValue = safeNumber(stones.reduce((sum, s) => sum + (s.totalStoneCost || 0), 0) * usdTryRate);

    const totalCost = safeNumber(rawMaterialCost + laborCost + totalSettingCost + totalStoneCostValue);
    const profitLoss = safeNumber((manufacturerPrice * usdTryRate) - totalCost);
    const manufacturerPriceTry = safeNumber(manufacturerPrice * usdTryRate);

    return {
      rawMaterialCost,
      laborCost,
      totalSettingCost,
      totalStoneCost: totalStoneCostValue,
      totalCost,
      profitLoss,
      manufacturerPriceTry,
    };
  };

  const costs = calculateCosts();

  useEffect(() => {
    if (selectedManufacturer) {
      form.setValue("manufacturerId", selectedManufacturer);
      setShowForm(true);
    }
  }, [selectedManufacturer, form]);

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

  const getSettingCost = (caratSize: number, quantity: number): number => {
    const settingRate = stoneRates?.find(r => 
      caratSize >= parseFloat(r.minCarat) && caratSize <= parseFloat(r.maxCarat)
    );
    return settingRate ? parseFloat(settingRate.pricePerStone) * quantity : 0;
  };

  const createMutation = useMutation({
    mutationFn: (data: { record: AnalysisFormValues; stones: StoneEntry[] }) => 
      apiRequest("POST", "/api/analysis-records", { ...data.record, stones: data.stones }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis-records"] });
      toast({ title: "Analiz kaydı oluşturuldu" });
      resetForm();
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
      resetForm();
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

  const resetForm = () => {
    setSelectedManufacturer("");
    setShowForm(false);
    setEditingId(null);
    form.reset();
    setStones([]);
    setFireValue([0]);
    setPolishEnabled(false);
  };

  const onSubmit = (data: AnalysisFormValues) => {
    const formData = { 
      ...data, 
      firePercentage: fireValue[0].toString(),
      rawMaterialCost: costs.rawMaterialCost.toFixed(2),
      laborCost: costs.laborCost.toFixed(2),
      totalSettingCost: costs.totalSettingCost.toFixed(2),
      totalStoneCost: costs.totalStoneCost.toFixed(2),
      totalCost: costs.totalCost.toFixed(2),
      profitLoss: costs.profitLoss.toFixed(2),
      goldPriceUsed: goldPricePerGram.toFixed(2),
      usdTryUsed: usdTryRate.toFixed(4),
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, record: formData, stones });
    } else {
      createMutation.mutate({ record: formData, stones });
    }
  };

  const addNewStoneRow = () => {
    setStones([...stones, {
      stoneType: "",
      caratSize: "",
      quantity: 1,
      pricePerCarat: 0,
      settingCost: 0,
      totalStoneCost: 0,
    }]);
  };

  const updateStone = async (index: number, field: keyof StoneEntry, value: string | number) => {
    const newStones = [...stones];
    const stone = { ...newStones[index] };
    
    if (field === "quantity") {
      stone.quantity = typeof value === "string" ? parseInt(value) || 1 : value;
    } else if (field === "discountPercent") {
      stone.discountPercent = typeof value === "string" ? parseFloat(value) || 0 : value;
    } else {
      (stone as any)[field] = value;
    }
    
    if (stone.stoneType && stone.caratSize) {
      const caratSize = parseFloat(stone.caratSize);
      const quantity = stone.quantity || 1;
      
      stone.settingCost = getSettingCost(caratSize, quantity);
      
      const isDiamond = stone.stoneType.toLowerCase().includes("elmas") || 
                        stone.stoneType.toLowerCase().includes("diamond") ||
                        stone.stoneType.toLowerCase().includes("pırlanta");
      
      if (isDiamond && stone.shape && stone.color && stone.clarity) {
        const rapPrice = await lookupRapaportPrice(stone.shape, caratSize, stone.color, stone.clarity);
        if (rapPrice) {
          stone.rapaportPrice = rapPrice;
          const discountPercent = stone.discountPercent || 0;
          const discountedPrice = rapPrice * (1 - discountPercent / 100);
          stone.totalStoneCost = discountedPrice * caratSize * quantity;
        } else {
          const gemstone = gemstonePrices?.find(g => g.stoneType === stone.stoneType);
          stone.pricePerCarat = gemstone ? parseFloat(gemstone.pricePerCarat) : 0;
          stone.totalStoneCost = stone.pricePerCarat * caratSize * quantity;
        }
      } else {
        const gemstone = gemstonePrices?.find(g => g.stoneType === stone.stoneType);
        stone.pricePerCarat = gemstone ? parseFloat(gemstone.pricePerCarat) : 0;
        stone.totalStoneCost = stone.pricePerCarat * caratSize * quantity;
      }
    }
    
    newStones[index] = stone;
    setStones(newStones);
  };

  const removeStone = (index: number) => {
    setStones(stones.filter((_, i) => i !== index));
  };

  const openEditRecord = (record: AnalysisRecordWithRelations) => {
    setEditingId(record.id);
    setSelectedManufacturer(record.manufacturerId?.toString() || "");
    form.reset({
      manufacturerId: record.manufacturerId?.toString() || "",
      productCode: record.productCode,
      totalGrams: record.totalGrams,
      goldLaborCost: record.goldLaborCost || "",
      goldLaborType: record.goldLaborType || "dollar",
      firePercentage: record.firePercentage || "0",
      polishAmount: record.polishAmount || "",
      certificateAmount: record.certificateAmount || "",
      manufacturerPrice: record.manufacturerPrice || "",
    });
    setFireValue([parseFloat(record.firePercentage || "0")]);
    setPolishEnabled(!!record.polishAmount && parseFloat(record.polishAmount) > 0);
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
    setShowForm(true);
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
          <h1 className="text-2xl font-semibold" data-testid="text-analysis-title">Maliyet Analizi</h1>
          <p className="text-muted-foreground">Mücevher maliyet analizi yapın</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Yeni Analiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block">Üretici Seçin</Label>
              <Select 
                value={selectedManufacturer} 
                onValueChange={(value) => {
                  setSelectedManufacturer(value);
                  if (!showForm) {
                    setEditingId(null);
                    form.reset();
                    setStones([]);
                    setFireValue([0]);
                  }
                }}
              >
                <SelectTrigger data-testid="select-manufacturer-main" className="w-full">
                  <SelectValue placeholder="Üretici seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers?.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showForm && (
              <Button variant="ghost" size="icon" onClick={resetForm} data-testid="button-close-form">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {showForm && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-muted/30 rounded-lg">
                  <FormField
                    control={form.control}
                    name="productCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ürün Kodu</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="totalGrams"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brüt Gram</FormLabel>
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
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="goldLaborCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Altın İşçiliği</FormLabel>
                          <div className="flex gap-1">
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.01"
                                placeholder="50" 
                                {...field} 
                                className="flex-1"
                                data-testid="input-gold-labor"
                              />
                            </FormControl>
                            <Select 
                              value={form.watch("goldLaborType")} 
                              onValueChange={(v) => form.setValue("goldLaborType", v)}
                            >
                              <SelectTrigger className="w-16" data-testid="select-labor-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dollar">$</SelectItem>
                                <SelectItem value="gold">gr</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormItem>
                    <FormLabel>Fire: {fireValue[0]}%</FormLabel>
                    <Slider
                      value={fireValue}
                      onValueChange={setFireValue}
                      max={20}
                      step={0.5}
                      className="py-4"
                      data-testid="slider-fire-percentage"
                    />
                  </FormItem>
                  <FormItem>
                    <FormLabel>Cila</FormLabel>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={polishEnabled} 
                        onCheckedChange={setPolishEnabled}
                        data-testid="switch-polish"
                      />
                      {polishEnabled && (
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="$"
                          value={form.watch("polishAmount") || ""}
                          onChange={(e) => form.setValue("polishAmount", e.target.value)}
                          className="w-20"
                          data-testid="input-polish"
                        />
                      )}
                    </div>
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="certificateAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sertifika ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="0" 
                            {...field} 
                            data-testid="input-certificate"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="manufacturerPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Üretici Fiyatı ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="0" 
                            {...field} 
                            data-testid="input-manufacturer-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Taşlar</h3>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={addNewStoneRow}
                      data-testid="button-add-stone"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Taş Ekle
                    </Button>
                  </div>

                  {stones.length > 0 ? (
                    <div className="space-y-3">
                      {stones.map((stone, index) => {
                        const isDiamond = stone.stoneType?.toLowerCase().includes("elmas") || 
                                          stone.stoneType?.toLowerCase().includes("diamond") ||
                                          stone.stoneType?.toLowerCase().includes("pırlanta");
                        
                        return (
                          <div key={index} className="p-4 border rounded-lg bg-background space-y-3">
                            <div className="flex items-start gap-4 flex-wrap">
                              <div className="min-w-[150px]">
                                <Label className="text-xs text-muted-foreground">Taş Türü</Label>
                                <Select 
                                  value={stone.stoneType} 
                                  onValueChange={(v) => updateStone(index, "stoneType", v)}
                                >
                                  <SelectTrigger data-testid={`select-stone-type-${index}`}>
                                    <SelectValue placeholder="Seçin" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {stoneTypes.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="w-24">
                                <Label className="text-xs text-muted-foreground">Karat</Label>
                                <Input 
                                  type="number"
                                  step="0.0001"
                                  placeholder="0.05"
                                  value={stone.caratSize}
                                  onChange={(e) => updateStone(index, "caratSize", e.target.value)}
                                  data-testid={`input-stone-carat-${index}`}
                                />
                              </div>
                              <div className="w-20">
                                <Label className="text-xs text-muted-foreground">Adet</Label>
                                <Input 
                                  type="number"
                                  min="1"
                                  value={stone.quantity}
                                  onChange={(e) => updateStone(index, "quantity", e.target.value)}
                                  data-testid={`input-stone-quantity-${index}`}
                                />
                              </div>
                              
                              {isDiamond && (
                                <>
                                  <div className="w-28">
                                    <Label className="text-xs text-muted-foreground">Kesim</Label>
                                    <Select 
                                      value={stone.shape || ""} 
                                      onValueChange={(v) => updateStone(index, "shape", v)}
                                    >
                                      <SelectTrigger data-testid={`select-stone-shape-${index}`}>
                                        <SelectValue placeholder="Seçin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {DIAMOND_SHAPES.map((shape) => (
                                          <SelectItem key={shape} value={shape}>
                                            {shape}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="w-20">
                                    <Label className="text-xs text-muted-foreground">Renk</Label>
                                    <Select 
                                      value={stone.color || ""} 
                                      onValueChange={(v) => updateStone(index, "color", v)}
                                    >
                                      <SelectTrigger data-testid={`select-stone-color-${index}`}>
                                        <SelectValue placeholder="Seçin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {DIAMOND_COLORS.map((color) => (
                                          <SelectItem key={color} value={color}>
                                            {color}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="w-20">
                                    <Label className="text-xs text-muted-foreground">Berraklık</Label>
                                    <Select 
                                      value={stone.clarity || ""} 
                                      onValueChange={(v) => updateStone(index, "clarity", v)}
                                    >
                                      <SelectTrigger data-testid={`select-stone-clarity-${index}`}>
                                        <SelectValue placeholder="Seçin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {DIAMOND_CLARITIES.map((clarity) => (
                                          <SelectItem key={clarity} value={clarity}>
                                            {clarity}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="w-20">
                                    <Label className="text-xs text-muted-foreground">İskonto %</Label>
                                    <Input 
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      placeholder="0"
                                      value={stone.discountPercent || ""}
                                      onChange={(e) => updateStone(index, "discountPercent", e.target.value)}
                                      data-testid={`input-stone-discount-${index}`}
                                    />
                                  </div>
                                </>
                              )}
                              
                              <div className="flex-1 flex items-end justify-end gap-4">
                                <div className="text-right">
                                  <Label className="text-xs text-muted-foreground">Mıhlama</Label>
                                  <div className="font-mono text-sm">${stone.settingCost?.toFixed(2) || "0.00"}</div>
                                </div>
                                <div className="text-right">
                                  <Label className="text-xs text-muted-foreground">Taş</Label>
                                  <div className="font-mono text-sm">${stone.totalStoneCost?.toFixed(2) || "0.00"}</div>
                                </div>
                                <div className="text-right">
                                  <Label className="text-xs text-muted-foreground">Toplam</Label>
                                  <div className="font-mono font-medium">${((stone.totalStoneCost || 0) + (stone.settingCost || 0)).toFixed(2)}</div>
                                </div>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeStone(index)}
                                  data-testid={`button-remove-stone-${index}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {isDiamond && stone.rapaportPrice && (
                              <div className="text-xs text-muted-foreground">
                                Rapaport: ${stone.rapaportPrice.toFixed(0)}/ct
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="flex justify-end p-3 bg-muted/50 rounded-lg">
                        <span className="font-medium">Toplam Taş Maliyeti: ${totalStoneCost.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg border-dashed">
                      Henüz taş eklenmedi. Taş eklemek için yukarıdaki butonu kullanın.
                    </div>
                  )}
                </div>

                <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                  <h3 className="font-medium text-lg">Maliyet Özeti</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Hammadde</p>
                      <p className="font-mono font-medium" data-testid="text-raw-material-cost">
                        {costs.rawMaterialCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ({form.watch("totalGrams") || "0"} gr x {(1 + fireValue[0] / 100).toFixed(3)})
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">İşçilik</p>
                      <p className="font-mono font-medium" data-testid="text-labor-cost">
                        {costs.laborCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Mıhlama</p>
                      <p className="font-mono font-medium" data-testid="text-setting-cost">
                        {costs.totalSettingCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Taş Maliyeti</p>
                      <p className="font-mono font-medium" data-testid="text-stone-cost">
                        {costs.totalStoneCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Toplam Maliyet</p>
                      <p className="font-mono font-bold text-xl" data-testid="text-total-cost">
                        {costs.totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Üretici Fiyatı</p>
                      <p className="font-mono font-bold text-xl" data-testid="text-manufacturer-price-try">
                        {costs.manufacturerPriceTry.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kâr / Zarar</p>
                      <p 
                        className={`font-mono font-bold text-xl ${costs.profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                        data-testid="text-profit-loss"
                      >
                        {costs.profitLoss >= 0 ? '+' : ''}{costs.profitLoss.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2">
                    Kurlar: 1 USD = {usdTryRate.toFixed(4)} TL | Altın = {goldPricePerGram.toFixed(2)} TL/gr
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    data-testid="button-cancel-analysis"
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-analysis"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {(createMutation.isPending || updateMutation.isPending) ? "Kaydediliyor..." : (editingId ? "Güncelle" : "Kaydet")}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

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
                  <p className="text-sm text-muted-foreground">Üretici Fiyatı</p>
                  <p className="font-medium font-mono">${selectedRecord.manufacturerPrice || "0"}</p>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <h4 className="font-medium">Maliyet Dağılımı</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Hammadde</p>
                    <p className="font-mono font-medium">
                      {parseFloat(selectedRecord.rawMaterialCost || "0").toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">İşçilik</p>
                    <p className="font-mono font-medium">
                      {parseFloat(selectedRecord.laborCost || "0").toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mıhlama</p>
                    <p className="font-mono font-medium">
                      {parseFloat(selectedRecord.totalSettingCost || "0").toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Taş Maliyeti</p>
                    <p className="font-mono font-medium">
                      {parseFloat(selectedRecord.totalStoneCost || "0").toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Toplam Maliyet</p>
                    <p className="font-mono font-bold text-lg">
                      {parseFloat(selectedRecord.totalCost || "0").toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kâr / Zarar</p>
                    <p className={`font-mono font-bold text-lg ${parseFloat(selectedRecord.profitLoss || "0") >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {parseFloat(selectedRecord.profitLoss || "0") >= 0 ? '+' : ''}{parseFloat(selectedRecord.profitLoss || "0").toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                    </p>
                  </div>
                </div>
                {(selectedRecord.goldPriceUsed || selectedRecord.usdTryUsed) && (
                  <div className="text-xs text-muted-foreground pt-2">
                    Kayıt anındaki kurlar: 1 USD = {parseFloat(selectedRecord.usdTryUsed || "0").toFixed(4)} TL | Altın = {parseFloat(selectedRecord.goldPriceUsed || "0").toFixed(2)} TL/gr
                  </div>
                )}
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
          <CardTitle className="text-lg">Kayıtlı Analizler</CardTitle>
          <div className="flex items-center gap-2 mt-2">
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
                    <TableHead>Kâr/Zarar</TableHead>
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
                          {parseFloat(record.totalCost || "0").toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                        </TableCell>
                        <TableCell>
                          {record.profitLoss && (
                            <span className={`font-mono font-medium ${parseFloat(record.profitLoss) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {parseFloat(record.profitLoss) >= 0 ? '+' : ''}{parseFloat(record.profitLoss).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                            </span>
                          )}
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
                              onClick={() => openEditRecord(record)}
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
                          <TableCell colSpan={8} className="p-4">
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
                  : "Henüz analiz kaydı oluşturulmamış. Yukarıdan yeni analiz ekleyerek başlayın."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
