import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Trash2, Search, FileText, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RapaportPrice } from "@shared/schema";

const SHAPES = ["Round", "Princess", "Oval", "Marquise", "Pear", "Heart", "Emerald", "Cushion", "Asscher", "Radiant"];
const COLORS = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
const CLARITIES = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3"];

export default function RapaportPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    shape: "",
    lowCarat: "",
    highCarat: "",
    color: "",
    clarity: "",
    pricePerCarat: "",
  });

  const { data: prices = [], isLoading } = useQuery<RapaportPrice[]>({
    queryKey: ["/api/rapaport-prices"],
  });

  const uploadMutation = useMutation({
    mutationFn: (data: { prices: any[]; clearExisting: boolean }) =>
      apiRequest("/api/rapaport-prices/upload", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rapaport-prices"] });
      toast({ title: "Yuklendi", description: "Rapaport fiyatlari kaydedildi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Fiyatlar yuklenemedi", variant: "destructive" });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => apiRequest("/api/rapaport-prices", "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rapaport-prices"] });
      toast({ title: "Temizlendi", description: "Tum Rapaport fiyatlari silindi" });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      toast({ 
        title: "PDF Destegi", 
        description: "PDF okuma ozelligi yaklasimda. Simdilik CSV veya manuel giris kullanin.",
        variant: "destructive" 
      });
      return;
    }

    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      const parsedPrices: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        if (cols.length >= 6) {
          parsedPrices.push({
            shape: cols[0],
            lowCarat: cols[1],
            highCarat: cols[2],
            color: cols[3],
            clarity: cols[4],
            pricePerCarat: cols[5],
          });
        }
      }
      
      if (parsedPrices.length > 0) {
        uploadMutation.mutate({ prices: parsedPrices, clearExisting: true });
      } else {
        toast({ title: "Hata", description: "CSV dosyasinda gecerli veri bulunamadi", variant: "destructive" });
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddEntry = () => {
    if (!newEntry.shape || !newEntry.lowCarat || !newEntry.highCarat || !newEntry.color || !newEntry.clarity || !newEntry.pricePerCarat) {
      toast({ title: "Hata", description: "Tum alanlari doldurun", variant: "destructive" });
      return;
    }
    uploadMutation.mutate({
      prices: [newEntry],
      clearExisting: false,
    });
    setNewEntry({ shape: "", lowCarat: "", highCarat: "", color: "", clarity: "", pricePerCarat: "" });
    setDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Rapaport Fiyat Listesi</h1>
        <div className="flex gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.pdf"
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            data-testid="button-upload-file"
          >
            <Upload className="h-4 w-4 mr-2" />
            CSV/PDF Yukle
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-price">
                <Plus className="h-4 w-4 mr-2" />
                Manuel Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rapaport Fiyati Ekle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sekil</Label>
                    <Select value={newEntry.shape} onValueChange={(v) => setNewEntry({...newEntry, shape: v})}>
                      <SelectTrigger data-testid="select-shape">
                        <SelectValue placeholder="Secin" />
                      </SelectTrigger>
                      <SelectContent>
                        {SHAPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Renk</Label>
                    <Select value={newEntry.color} onValueChange={(v) => setNewEntry({...newEntry, color: v})}>
                      <SelectTrigger data-testid="select-color">
                        <SelectValue placeholder="Secin" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Berraklik</Label>
                    <Select value={newEntry.clarity} onValueChange={(v) => setNewEntry({...newEntry, clarity: v})}>
                      <SelectTrigger data-testid="select-clarity">
                        <SelectValue placeholder="Secin" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLARITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fiyat ($/karat)</Label>
                    <Input
                      type="number"
                      value={newEntry.pricePerCarat}
                      onChange={(e) => setNewEntry({...newEntry, pricePerCarat: e.target.value})}
                      data-testid="input-price"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Karat</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newEntry.lowCarat}
                      onChange={(e) => setNewEntry({...newEntry, lowCarat: e.target.value})}
                      data-testid="input-low-carat"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Karat</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newEntry.highCarat}
                      onChange={(e) => setNewEntry({...newEntry, highCarat: e.target.value})}
                      data-testid="input-high-carat"
                    />
                  </div>
                </div>
                <Button onClick={handleAddEntry} className="w-full" data-testid="button-save-price">
                  Kaydet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {prices.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              data-testid="button-clear-all"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Tumunu Sil
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fiyat Listesi ({prices.length} kayit)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Yukleniyor...</p>
          ) : prices.length === 0 ? (
            <p className="text-muted-foreground">Henuz fiyat listesi yuklenmedi. CSV dosyasi yukleyin veya manuel ekleyin.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sekil</TableHead>
                    <TableHead>Karat Araligi</TableHead>
                    <TableHead>Renk</TableHead>
                    <TableHead>Berraklik</TableHead>
                    <TableHead className="text-right">Fiyat ($/karat)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.slice(0, 100).map((price) => (
                    <TableRow key={price.id} data-testid={`row-price-${price.id}`}>
                      <TableCell>{price.shape}</TableCell>
                      <TableCell>{price.lowCarat} - {price.highCarat}</TableCell>
                      <TableCell>{price.color}</TableCell>
                      <TableCell>{price.clarity}</TableCell>
                      <TableCell className="text-right font-mono">${price.pricePerCarat}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {prices.length > 100 && (
                <p className="text-sm text-muted-foreground mt-4">...ve {prices.length - 100} daha fazla kayit</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Indirim Hesaplama Formulu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md font-mono text-sm">
            <p>Nihai Fiyat = Rapaport Fiyati x (1 - Indirim Orani) x Karat</p>
            <p className="mt-2 text-muted-foreground">Ornek: $5000/ct x (1 - 0.35) x 1.5ct = $4,875</p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Her tas satiri icin bagimsiz indirim orani uygulayabilirsiniz. Bu formul, analiz kayitlarinda otomatik olarak hesaplanir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
