import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowLeft, FileText, Download, Factory, Calendar, Package, TrendingUp, TrendingDown, Loader2, Mail, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  pendant: "Kolye Ucu",
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
  const { toast } = useToast();
  const { user } = useAuth();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  const { data, isLoading } = useQuery<BatchDetailsResponse>({
    queryKey: [`/api/batches/${batchId}/details`],
    enabled: !!batchId,
  });

  const batch = data?.batch;
  const records = data?.records || [];
  
  const sendEmailMutation = useMutation({
    mutationFn: async ({ email, subject, htmlContent }: { email: string; subject: string; htmlContent: string }) => {
      const response = await apiRequest("POST", "/api/send-batch-report", {
        batchId,
        email,
        subject,
        htmlContent,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "E-posta gonderilemedi");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "E-posta gonderildi",
        description: `Rapor basariyla ${recipientEmail} adresine gonderildi.`,
      });
      setEmailDialogOpen(false);
      setRecipientEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "E-posta gonderilirken bir hata olustu.",
        variant: "destructive",
      });
    },
  });

  const getStoneInfo = (record: AnalysisRecordWithRelations) => {
    const stones = record.stones || [];
    if (stones.length === 0) return { type: "-", cost: 0 };
    const types = Array.from(new Set(stones.map(s => s.stoneType))).join(", ");
    const cost = stones.reduce((sum, s) => sum + parseFloat(s.totalStoneCost || "0"), 0);
    return { type: types || "-", cost };
  };

  const calculateTotalCost = (record: AnalysisRecordWithRelations) => {
    const rawMaterial = parseFloat(record.rawMaterialCost || "0");
    const labor = parseFloat(record.laborCost || "0");
    const polish = parseFloat(record.polishAmount || "0");
    const certificate = parseFloat(record.certificateAmount || "0");
    const setting = parseFloat(record.totalSettingCost || "0");
    const stone = parseFloat(record.totalStoneCost || "0");
    return rawMaterial + labor + polish + certificate + setting + stone;
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
    analysis: records.reduce((sum, r) => sum + calculateTotalCost(r), 0),
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
      const analysis = calculateTotalCost(record);
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
      const analysis = calculateTotalCost(record);
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

  const generateEmailHtml = () => {
    if (!batch) return "";
    
    const tableRows = records.map((record) => {
      const stoneInfo = getStoneInfo(record);
      const analysis = calculateTotalCost(record);
      const manufacturer = parseFloat(record.manufacturerPrice || "0");
      const diff = calculateDiff(analysis, manufacturer);
      const diffColor = diff > 0 ? "#dc2626" : "#16a34a";
      const rawMaterial = parseFloat(record.rawMaterialCost || "0");
      const labor = parseFloat(record.laborCost || "0");
      const setting = parseFloat(record.totalSettingCost || "0");
      const polish = parseFloat(record.polishAmount || "0");
      const certificate = parseFloat(record.certificateAmount || "0");
      
      return `
        <tr>
          <td style="padding:6px 4px;border:1px solid #e5e7eb;font-size:12px;">${record.productCode}</td>
          <td style="padding:6px 4px;border:1px solid #e5e7eb;font-size:12px;">${PRODUCT_TYPES[record.productType || ""] || record.productType || "-"}</td>
          <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">${parseFloat(record.totalGrams || "0").toFixed(2)}</td>
          <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(rawMaterial)}</td>
          <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(labor)}</td>
          <td style="padding:6px 4px;border:1px solid #e5e7eb;font-size:12px;">${stoneInfo.type}</td>
          <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(stoneInfo.cost)}</td>
          <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(setting)}</td>
          <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(polish)}</td>
          <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(certificate)}</td>
          <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;font-weight:600;">$${formatCurrency(analysis)}</td>
          <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(manufacturer)}</td>
          <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;color:${diffColor};font-weight:600;">${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%</td>
        </tr>
      `;
    }).join("");

    const overallDiffColor = isPositiveDiff ? "#dc2626" : "#16a34a";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Parti Raporu #${batch.batchNumber}</title>
      </head>
      <body style="font-family:Arial,sans-serif;max-width:1200px;margin:0 auto;padding:20px;">
        <div style="border-bottom:2px solid #3b82f6;padding-bottom:16px;margin-bottom:20px;">
          <h2 style="color:#1f2937;margin:0 0 4px 0;">${user?.companyName || "Firma"}</h2>
          <p style="color:#6b7280;margin:0;font-size:14px;">Analizi Yapan: <strong>${user?.fullName || "Bilinmeyen"}</strong></p>
        </div>
        <h1 style="color:#1f2937;">Parti #${batch.batchNumber} - Maliyet Analiz Raporu</h1>
        <p style="color:#6b7280;">Uretici: <strong>${batch.manufacturer?.name || "Bilinmeyen"}</strong></p>
        <p style="color:#6b7280;">Tarih: ${format(new Date(batch.createdAt), "d MMMM yyyy", { locale: tr })}</p>
        <p style="color:#6b7280;">Urun Sayisi: ${records.length}</p>
        
        <div style="display:flex;gap:16px;margin:20px 0;flex-wrap:wrap;">
          <div style="background:#f3f4f6;padding:12px 16px;border-radius:8px;">
            <p style="margin:0;color:#6b7280;font-size:12px;">Toplam Analiz</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:600;">$${formatCurrency(totals.analysis)}</p>
          </div>
          <div style="background:#f3f4f6;padding:12px 16px;border-radius:8px;">
            <p style="margin:0;color:#6b7280;font-size:12px;">Toplam Uretici</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:600;">$${formatCurrency(totals.manufacturer)}</p>
          </div>
          <div style="background:#f3f4f6;padding:12px 16px;border-radius:8px;">
            <p style="margin:0;color:#6b7280;font-size:12px;">Genel Fark</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:${overallDiffColor};">${overallDiff >= 0 ? "+" : ""}${overallDiff.toFixed(1)}%</p>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-top:20px;">
          <thead>
            <tr style="background:#3b82f6;color:white;">
              <th style="padding:6px 4px;border:1px solid #3b82f6;text-align:left;font-size:11px;">Stok No</th>
              <th style="padding:6px 4px;border:1px solid #3b82f6;text-align:left;font-size:11px;">Cinsi</th>
              <th style="padding:6px 4px;border:1px solid #3b82f6;text-align:right;font-size:11px;">Hammadde Gr</th>
              <th style="padding:6px 4px;border:1px solid #3b82f6;text-align:right;font-size:11px;">Hammadde $</th>
              <th style="padding:6px 4px;border:1px solid #3b82f6;text-align:right;font-size:11px;">Iscilik $</th>
              <th style="padding:6px 4px;border:1px solid #3b82f6;text-align:left;font-size:11px;">Tas Cinsi</th>
              <th style="padding:6px 4px;border:1px solid #3b82f6;text-align:right;font-size:11px;">Tas $</th>
              <th style="padding:6px 4px;border:1px solid #3b82f6;text-align:right;font-size:11px;">Mihlama $</th>
              <th style="padding:6px 4px;border:1px solid #3b82f6;text-align:right;font-size:11px;">Cila $</th>
              <th style="padding:6px 4px;border:1px solid #3b82f6;text-align:right;font-size:11px;">Sertifika $</th>
              <th style="padding:6px 4px;border:1px solid #3b82f6;text-align:right;font-size:11px;">Analiz $</th>
              <th style="padding:6px 4px;border:1px solid #3b82f6;text-align:right;font-size:11px;">Uretici $</th>
              <th style="padding:6px 4px;border:1px solid #3b82f6;text-align:right;font-size:11px;">Fark %</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr style="background:#f3f4f6;font-weight:600;">
              <td style="padding:6px 4px;border:1px solid #e5e7eb;font-size:12px;" colspan="3">TOPLAM</td>
              <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(totals.rawMaterial)}</td>
              <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(totals.labor)}</td>
              <td style="padding:6px 4px;border:1px solid #e5e7eb;font-size:12px;"></td>
              <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(totals.stone)}</td>
              <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(totals.setting)}</td>
              <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(totals.polish)}</td>
              <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(totals.certificate)}</td>
              <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(totals.analysis)}</td>
              <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;">$${formatCurrency(totals.manufacturer)}</td>
              <td style="padding:6px 4px;border:1px solid #e5e7eb;text-align:right;font-size:12px;color:${overallDiffColor};">${overallDiff >= 0 ? "+" : ""}${overallDiff.toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>
        
        <p style="color:#9ca3af;font-size:12px;margin-top:30px;">Bu rapor Maliyet Analizi uygulamasi tarafindan olusturulmustur.</p>
      </body>
      </html>
    `;
  };

  const handleSendEmail = () => {
    if (!recipientEmail || !batch) return;
    
    const subject = `Parti #${batch.batchNumber} - ${batch.manufacturer?.name || "Uretici"} Maliyet Raporu`;
    const htmlContent = generateEmailHtml();
    
    sendEmailMutation.mutate({ email: recipientEmail, subject, htmlContent });
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
        
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportExcel} data-testid="button-export-excel">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={exportPDF} data-testid="button-export-pdf">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-send-email">
                <Mail className="h-4 w-4 mr-2" />
                E-posta Gonder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Raporu E-posta ile Gonder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Alici E-posta Adresi</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@firma.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    data-testid="input-recipient-email"
                  />
                </div>
                {batch?.manufacturer?.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRecipientEmail(batch.manufacturer?.email || "")}
                    data-testid="button-use-manufacturer-email"
                  >
                    Uretici e-postasini kullan: {batch.manufacturer.email}
                  </Button>
                )}
                <Button
                  className="w-full"
                  onClick={handleSendEmail}
                  disabled={!recipientEmail || sendEmailMutation.isPending}
                  data-testid="button-confirm-send-email"
                >
                  {sendEmailMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gonderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Raporu Gonder
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                  const analysis = calculateTotalCost(record);
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
