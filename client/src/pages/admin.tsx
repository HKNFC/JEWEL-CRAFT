import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings, Mail, Plus, X, Users } from "lucide-react";
import type { AdminSettings } from "@shared/schema";

export default function AdminPage() {
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useQuery<AdminSettings>({
    queryKey: ["/api/admin/settings"],
  });

  const [ownerEmail, setOwnerEmail] = useState("");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [newCcEmail, setNewCcEmail] = useState("");

  useEffect(() => {
    if (settings) {
      setOwnerEmail(settings.ownerEmail || "");
      setCcEmails(settings.ccEmails || []);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: { ownerEmail: string; ccEmails: string[] }) => {
      const res = await apiRequest("PATCH", "/api/admin/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Ayarlar kaydedildi" });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.message || "Ayarlar kaydedilemedi",
        variant: "destructive",
      });
    },
  });

  const handleAddCcEmail = () => {
    const email = newCcEmail.trim();
    if (!email) return;
    if (!email.includes("@")) {
      toast({
        title: "Hata",
        description: "Geçerli bir e-posta adresi girin",
        variant: "destructive",
      });
      return;
    }
    if (ccEmails.includes(email)) {
      toast({
        title: "Hata",
        description: "Bu e-posta zaten listede",
        variant: "destructive",
      });
      return;
    }
    setCcEmails([...ccEmails, email]);
    setNewCcEmail("");
  };

  const handleRemoveCcEmail = (email: string) => {
    setCcEmails(ccEmails.filter((e) => e !== email));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ ownerEmail, ccEmails });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Paneli</h1>
        <p className="text-muted-foreground">E-posta bildirim ayarlarını yönetin</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>E-posta Bildirim Ayarları</CardTitle>
            </div>
            <CardDescription>
              Raporlar gönderildiğinde bilgilendirilecek e-posta adreslerini yönetin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">İş Sahibi E-posta</Label>
              <Input
                id="ownerEmail"
                type="email"
                data-testid="input-owner-email"
                placeholder="isashibi@firma.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Tüm raporlar bu adrese de CC olarak gönderilecek
              </p>
            </div>

            <div className="space-y-2">
              <Label>Bilgi (CC) Listesi</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Raporların kopyasının gitmesini istediğiniz diğer e-posta adresleri
              </p>
              
              <div className="flex gap-2">
                <Input
                  type="email"
                  data-testid="input-new-cc-email"
                  placeholder="yeni@email.com"
                  value={newCcEmail}
                  onChange={(e) => setNewCcEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCcEmail();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  data-testid="button-add-cc"
                  onClick={handleAddCcEmail}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {ccEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {ccEmails.map((email) => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="pl-3 pr-1 py-1 flex items-center gap-1"
                    >
                      {email}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1"
                        data-testid={`button-remove-cc-${email}`}
                        onClick={() => handleRemoveCcEmail(email)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              {ccEmails.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  Henüz CC listesinde e-posta yok
                </p>
              )}
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                data-testid="button-save-admin"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>E-posta Gönderim Özeti</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Raporlar gönderildiğinde aşağıdaki adreslere bildirim yapılacak:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">TO</Badge>
              <span className="text-sm">Üretici e-posta adresi (rapor sayfasından seçilen)</span>
            </div>
            {ownerEmail && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">CC</Badge>
                <span className="text-sm">{ownerEmail} (İş Sahibi)</span>
              </div>
            )}
            {ccEmails.map((email) => (
              <div key={email} className="flex items-center gap-2">
                <Badge variant="secondary">CC</Badge>
                <span className="text-sm">{email}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
