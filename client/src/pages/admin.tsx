import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Mail, Plus, X, Users, Trash2, UserPlus, Key } from "lucide-react";
import type { AdminSettings, User } from "@shared/schema";

type SafeUser = Omit<User, "passwordHash">;

export default function AdminPage() {
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useQuery<AdminSettings>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const [ownerEmail, setOwnerEmail] = useState("");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [newCcEmail, setNewCcEmail] = useState("");
  const [globalEmailApiKey, setGlobalEmailApiKey] = useState("");
  
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<SafeUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newUser, setNewUser] = useState({
    companyName: "",
    username: "",
    password: "",
    fullName: "",
    email: "",
    isAdmin: false,
  });

  useEffect(() => {
    if (settings) {
      setOwnerEmail(settings.ownerEmail || "");
      setCcEmails(settings.ccEmails || []);
      setGlobalEmailApiKey(settings.globalEmailApiKey || "");
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: { ownerEmail: string; ccEmails: string[]; globalEmailApiKey?: string }) => {
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

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newUser) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Kullanıcı oluşturuldu" });
      setShowNewUserDialog(false);
      setNewUser({ companyName: "", username: "", password: "", fullName: "", email: "", isAdmin: false });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.message || "Kullanıcı oluşturulamadı",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Kullanıcı silindi" });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.message || "Kullanıcı silinemedi",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/password`, { newPassword });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Şifre güncellendi" });
      setShowResetPasswordDialog(false);
      setSelectedUserForReset(null);
      setNewPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.message || "Şifre güncellenemedi",
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
    // Eğer yeni CC e-posta alanında yazılmış ama eklenmemiş bir e-posta varsa, otomatik ekle
    let finalCcEmails = [...ccEmails];
    const pendingEmail = newCcEmail.trim();
    if (pendingEmail && pendingEmail.includes("@") && !ccEmails.includes(pendingEmail)) {
      finalCcEmails.push(pendingEmail);
      setCcEmails(finalCcEmails);
      setNewCcEmail("");
    }
    updateMutation.mutate({ ownerEmail, ccEmails: finalCcEmails, globalEmailApiKey: globalEmailApiKey || undefined });
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
              <Label htmlFor="globalEmailApiKey">Resend API Anahtarı</Label>
              <Input
                id="globalEmailApiKey"
                type="password"
                data-testid="input-global-email-api-key"
                placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                value={globalEmailApiKey}
                onChange={(e) => setGlobalEmailApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                E-posta göndermek için kullanılacak Resend API anahtarı. Tüm kullanıcılar bu anahtarı kullanacak.
              </p>
            </div>

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
            <Mail className="h-5 w-5" />
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Kullanıcı Yönetimi</CardTitle>
            </div>
            <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-user">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Yeni Kullanıcı
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newUser.password.length < 6) {
                      toast({ title: "Hata", description: "Şifre en az 6 karakter olmalı", variant: "destructive" });
                      return;
                    }
                    createUserMutation.mutate(newUser);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Firma Adı *</Label>
                    <Input
                      data-testid="input-new-user-company"
                      value={newUser.companyName}
                      onChange={(e) => setNewUser({ ...newUser, companyName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kullanıcı Adı *</Label>
                    <Input
                      data-testid="input-new-user-username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Şifre *</Label>
                    <Input
                      type="password"
                      data-testid="input-new-user-password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ad Soyad</Label>
                    <Input
                      data-testid="input-new-user-fullname"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-posta</Label>
                    <Input
                      type="email"
                      data-testid="input-new-user-email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isAdmin"
                      data-testid="checkbox-new-user-admin"
                      checked={newUser.isAdmin}
                      onCheckedChange={(checked) => setNewUser({ ...newUser, isAdmin: checked === true })}
                    />
                    <Label htmlFor="isAdmin">Admin yetkisi ver</Label>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowNewUserDialog(false)}>
                      İptal
                    </Button>
                    <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-create-user">
                      {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Oluştur
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>Sisteme erişebilecek kullanıcıları yönetin</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı Adı</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Yetki</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.companyName}</TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge variant="default">Admin</Badge>
                        ) : (
                          <Badge variant="secondary">Kullanıcı</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`button-reset-password-${user.id}`}
                            onClick={() => {
                              setSelectedUserForReset(user);
                              setNewPassword("");
                              setShowResetPasswordDialog(true);
                            }}
                            title="Şifre Sıfırla"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`button-delete-user-${user.id}`}
                            onClick={() => {
                              if (confirm(`${user.username} kullanıcısını silmek istediğinize emin misiniz?`)) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Henüz kullanıcı yok</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şifre Sıfırla</DialogTitle>
          </DialogHeader>
          {selectedUserForReset && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPassword.length < 6) {
                  toast({ title: "Hata", description: "Şifre en az 6 karakter olmalı", variant: "destructive" });
                  return;
                }
                resetPasswordMutation.mutate({ id: selectedUserForReset.id, newPassword });
              }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                <strong>{selectedUserForReset.username}</strong> kullanıcısı için yeni şifre belirleyin.
              </p>
              <div className="space-y-2">
                <Label>Yeni Şifre *</Label>
                <Input
                  type="password"
                  data-testid="input-new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowResetPasswordDialog(false);
                    setSelectedUserForReset(null);
                    setNewPassword("");
                  }}
                >
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  disabled={resetPasswordMutation.isPending}
                  data-testid="button-confirm-reset-password"
                >
                  {resetPasswordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Şifreyi Güncelle
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
