import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowLeft, FileText, Download, Factory, Calendar, Package, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BatchWithRelations, AnalysisRecordWithRelations } from "@shared/schema";

interface BatchDetailsResponse {
  batch: BatchWithRelations;
  records: AnalysisRecordWithRelations[];
}

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

export default function BatchDetailPage() {
  const [, params] = useRoute("/batch/:id");
  const batchId = params?.id ? parseInt(params.id) : null;

  const { data, isLoading } = useQuery<BatchDetailsResponse>({
    queryKey: [`/api/batches/${batchId}/details`],
    enabled: !!batchId,
  });

  const batch = data?.batch;
  const records = data?.records || [];

  const getStoneInfo = (record: AnalysisRecordWithRelations) => {
    const stones = record.stones || [];
    if (stones.length === 0) return { type: "-", cost: 0 };
    const types = Array.from(new Set(stones.map(s => s.stoneType))).join(", ");
    const cost = stones.reduce((sum, s) => sum + parseFloat(s.totalStoneCost || "0"), 0);
    return { type: types || "-", cost };
  };

  const calculateDiff = (analysis: number, manufacturer: number) => {
    if (analysis === 0) return 0;
    return ((manufacturer - analysis) / analysis) * 100;
  };

  const totals = {
    rawMaterial: records.reduce((sum, r) => sum + parseFloat(r.rawMaterialCost || "0"), 0),
    labor: records.reduce((sum, r) => sum + parseFloat(r.laborCost || "0"), 0),
    stone: records.reduce((sum, r) => sum + parseFloat(r.totalStoneCost || "0"), 0),
    setting: records.reduce((sum, r) => sum + parseFloat(r.totalSettingCost || "0"), 0),
    polish: records.reduce((sum, r) => sum + parseFloat(r.polishAmount || "0"), 0),
    certificate: records.reduce((sum, r) => sum + parseFloat(r.certificateAmount || "0"), 0),
    analysis: records.reduce((sum, r) => sum + parseFloat(r.totalCost || "0"), 0),
    manufacturer: records.reduce((sum, r) => sum + parseFloat(r.manufacturerPrice || "0"), 0),
  };

  const overallDiff = calculateDiff(totals.analysis, totals.manufacturer);
  const isPositiveDiff = overallDiff > 0;

  const formatCurrency = (value: number) => {
    return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const exportPDF = () => {
    if (!batch) return;
    
    const doc = new jsPDF({ orientation: "landscape" });
    
    doc.setFontSize(16);
    doc.text(`Parti #${batch.batchNumber} - ${batch.manufacturer?.name || "Bilinmeyen"}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Tarih: ${format(new Date(batch.createdAt), "d MMMM yyyy", { locale: tr })}`, 14, 22);
    doc.text(`Urun Sayisi: ${records.length}`, 14, 28);

    const tableData = records.map((record) => {
      const stoneInfo = getStoneInfo(record);
      const analysis = parseFloat(record.totalCost || "0");
      const manufacturer = parseFloat(record.manufacturerPrice || "0");
      const diff = calculateDiff(analysis, manufacturer);
      
      return [
        record.productCode,
        PRODUCT_TYPES[record.productType || ""] || record.productType || "-",
        parseFloat(record.totalGrams || "0").toFixed(2),
        formatCurrency(parseFloat(record.rawMaterialCost || "0")),
        formatCurrency(parseFloat(record.laborCost || "0")),
        stoneInfo.type.substring(0, 15),
        formatCurrency(stoneInfo.cost),
        formatCurrency(parseFloat(record.totalSettingCost || "0")),
        formatCurrency(parseFloat(record.polishAmount || "0")),
        formatCurrency(parseFloat(record.certificateAmount || "0")),
        formatCurrency(analysis),
        formatCurrency(manufacturer),
        `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`,
      ];
    });

    tableData.push([
      "TOPLAM",
      "",
      "",
      formatCurrency(totals.rawMaterial),
      formatCurrency(totals.labor),
      "",
      formatCurrency(totals.stone),
      formatCurrency(totals.setting),
      formatCurrency(totals.polish),
      formatCurrency(totals.certificate),
      formatCurrency(totals.analysis),
      formatCurrency(totals.manufacturer),
      `${overallDiff >= 0 ? "+" : ""}${overallDiff.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      head: [[
        "Kod",
        "Cins",
        "Gr",
        "Hammadde $",
        "Iscilik $",
        "Tas",
        "Tas $",
        "Mihlama $",
        "Cila $",
        "Sertifika $",
        "Analiz $",
        "Uretici $",
        "Fark %",
      ]],
      body: tableData,
      startY: 35,
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [59, 130, 246] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    });

    doc.save(`parti-${batch.batchNumber}-${batch.manufacturer?.name || "rapor"}.pdf`);
  };

  const exportExcel = () => {
    if (!batch || records.length === 0) return;

    const headers = [
      "Ürün Kodu",
      "Ürün Cinsi",
      "Altın Ağırlığı (gr)",
      "Hammadde Maliyeti ($)",
      "İşçilik Maliyeti ($)",
      "Taş Cinsi",
      "Taş Maliyeti ($)",
      "Mıhlama Maliyeti ($)",
      "Cila ($)",
      "Sertifika ($)",
      "Analiz Sonucu ($)",
      "Üretici Fiyatı ($)",
      "Fark (%)"
    ];

    const rows = records.map((record) => {
      const stoneInfo = getStoneInfo(record);
      const analysis = parseFloat(record.totalCost || "0");
      const manufacturer = parseFloat(record.manufacturerPrice || "0");
      const diff = calculateDiff(analysis, manufacturer);
      
      return [
        record.productCode,
        PRODUCT_TYPES[record.productType || ""] || record.productType || "-",
        parseFloat(record.totalGrams || "0"),
        parseFloat(record.rawMaterialCost || "0"),
        parseFloat(record.laborCost || "0"),
        stoneInfo.type,
        stoneInfo.cost,
        parseFloat(record.totalSettingCost || "0"),
        parseFloat(record.polishAmount || "0"),
        parseFloat(record.certificateAmount || "0"),
        analysis,
        manufacturer,
        diff,
      ];
    });

    rows.push([
      "TOPLAM",
      "",
      "",
      totals.rawMaterial,
      totals.labor,
      "",
      totals.stone,
      totals.setting,
      totals.polish,
      totals.certificate,
      totals.analysis,
      totals.manufacturer,
      overallDiff,
    ]);

    const csvContent = [
      headers.join("\t"),
      ...rows.map(row => row.join("\t"))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `parti-${batch.batchNumber}-${batch.manufacturer?.name || "rapor"}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">Parti bulunamadı</p>
            <Link href="/batches">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Parti Listesine Dön
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/batches">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">
              Parti #{batch.batchNumber}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Factory className="h-3 w-3" />
                {batch.manufacturer?.name || "Bilinmeyen"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(batch.createdAt), "d MMMM yyyy", { locale: tr })}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {records.length} ürün
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportExcel} data-testid="button-export-excel">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={exportPDF} data-testid="button-export-pdf">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Toplam Hammadde</p>
            <p className="text-xl font-semibold">${formatCurrency(totals.rawMaterial)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Toplam Taş</p>
            <p className="text-xl font-semibold">${formatCurrency(totals.stone)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Toplam Analiz</p>
            <p className="text-xl font-semibold">${formatCurrency(totals.analysis)}</p>
          </CardContent>
        </Card>
        <Card className={isPositiveDiff ? "border-destructive/50" : "border-green-500/50"}>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Parti Genel Farkı</p>
            <div className={`flex items-center gap-1 text-xl font-semibold ${isPositiveDiff ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
              {isPositiveDiff ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              <span data-testid="text-overall-diff">
                {overallDiff >= 0 ? "+" : ""}{overallDiff.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Ürün Detayları</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10">Ürün Kodu</TableHead>
                  <TableHead>Cinsi</TableHead>
                  <TableHead className="text-right">Ağırlık (gr)</TableHead>
                  <TableHead className="text-right">Hammadde $</TableHead>
                  <TableHead className="text-right">İşçilik $</TableHead>
                  <TableHead>Taş Cinsi</TableHead>
                  <TableHead className="text-right">Taş $</TableHead>
                  <TableHead className="text-right">Mıhlama $</TableHead>
                  <TableHead className="text-right">Cila $</TableHead>
                  <TableHead className="text-right">Sertifika $</TableHead>
                  <TableHead className="text-right">Analiz $</TableHead>
                  <TableHead className="text-right">Üretici $</TableHead>
                  <TableHead className="text-right">Fark %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const stoneInfo = getStoneInfo(record);
                  const analysis = parseFloat(record.totalCost || "0");
                  const manufacturer = parseFloat(record.manufacturerPrice || "0");
                  const diff = calculateDiff(analysis, manufacturer);
                  const isDiffPositive = diff > 0;
                  
                  return (
                    <TableRow key={record.id} data-testid={`row-product-${record.id}`}>
                      <TableCell className="font-medium sticky left-0 bg-background z-10" data-testid={`text-code-${record.id}`}>
                        {record.productCode}
                      </TableCell>
                      <TableCell>{PRODUCT_TYPES[record.productType || ""] || record.productType || "-"}</TableCell>
                      <TableCell className="text-right">{parseFloat(record.totalGrams || "0").toFixed(2)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(parseFloat(record.rawMaterialCost || "0"))}</TableCell>
                      <TableCell className="text-right">{formatCurrency(parseFloat(record.laborCost || "0"))}</TableCell>
                      <TableCell className="max-w-[100px] truncate" title={stoneInfo.type}>{stoneInfo.type}</TableCell>
                      <TableCell className="text-right">{formatCurrency(stoneInfo.cost)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(parseFloat(record.totalSettingCost || "0"))}</TableCell>
                      <TableCell className="text-right">{formatCurrency(parseFloat(record.polishAmount || "0"))}</TableCell>
                      <TableCell className="text-right">{formatCurrency(parseFloat(record.certificateAmount || "0"))}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(analysis)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(manufacturer)}</TableCell>
                      <TableCell className={`text-right font-medium ${isDiffPositive ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                        {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell className="sticky left-0 bg-muted/50 z-10">TOPLAM</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.rawMaterial)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.labor)}</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.stone)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.setting)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.polish)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.certificate)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.analysis)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.manufacturer)}</TableCell>
                  <TableCell className={`text-right ${isPositiveDiff ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                    {overallDiff >= 0 ? "+" : ""}{overallDiff.toFixed(1)}%
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
