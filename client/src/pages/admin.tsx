import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings, Mail, Plus, X, Users, Key, Trash2, UserPlus, Shield, User as UserIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { AdminSettings, User } from "@shared/schema";

type SafeUser = Omit<User, "passwordHash">;

export default function AdminPage() {
  const { toast } = useToast();
  
  const { data: settings, isLoading: settingsLoading } = useQuery<AdminSettings>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const [ownerEmail, setOwnerEmail] = useState("");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [newCcEmail, setNewCcEmail] = useState("");
  const [emailApiKey, setEmailApiKey] = useState("");

  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    fullName: "",
    companyName: "",
    email: "",
    gender: "male",
    isAdmin: false,
  });

  useEffect(() => {
    if (settings) {
      setOwnerEmail(settings.ownerEmail || "");
      setCcEmails(settings.ccEmails || []);
      setEmailApiKey("");
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { ownerEmail: string; ccEmails: string[]; emailApiKey?: string }) => {
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
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Kullanıcı oluşturulamadı");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Kullanıcı oluşturuldu" });
      setNewUserDialogOpen(false);
      setNewUser({
        username: "",
        password: "",
        fullName: "",
        companyName: "",
        email: "",
        gender: "male",
        isAdmin: false,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/password`, { newPassword });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Şifre güncellenemedi");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Şifre güncellendi" });
      setResetPasswordDialogOpen(false);
      setNewPassword("");
      setSelectedUserId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Kullanıcı silinemedi");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Kullanıcı silindi" });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
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

  const handleSubmitSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({ 
      ownerEmail, 
      ccEmails,
      ...(emailApiKey ? { emailApiKey } : {})
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(newUser);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId && newPassword) {
      resetPasswordMutation.mutate({ id: selectedUserId, newPassword });
    }
  };

  const openResetPasswordDialog = (userId: number) => {
    setSelectedUserId(userId);
    setNewPassword("");
    setResetPasswordDialogOpen(true);
  };

  if (settingsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Paneli</h1>
        <p className="text-muted-foreground">Kullanıcı ve e-posta ayarlarını yönetin</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Kullanıcı Yönetimi</CardTitle>
            </div>
            <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-user">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Yeni Kullanıcı
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
                  <DialogDescription>
                    Sisteme yeni bir kullanıcı ekleyin
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Kullanıcı Adı *</Label>
                      <Input
                        id="username"
                        data-testid="input-new-username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Şifre *</Label>
                      <Input
                        id="password"
                        type="password"
                        data-testid="input-new-password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Ad Soyad *</Label>
                      <Input
                        id="fullName"
                        data-testid="input-new-fullname"
                        value={newUser.fullName}
                        onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Firma Adı *</Label>
                      <Input
                        id="companyName"
                        data-testid="input-new-company"
                        value={newUser.companyName}
                        onChange={(e) => setNewUser({ ...newUser, companyName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta</Label>
                      <Input
                        id="email"
                        type="email"
                        data-testid="input-new-email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Cinsiyet</Label>
                      <Select
                        value={newUser.gender}
                        onValueChange={(value) => setNewUser({ ...newUser, gender: value })}
                      >
                        <SelectTrigger data-testid="select-new-gender">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Erkek</SelectItem>
                          <SelectItem value="female">Kadın</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isAdmin"
                      checked={newUser.isAdmin}
                      onCheckedChange={(checked) => setNewUser({ ...newUser, isAdmin: !!checked })}
                      data-testid="checkbox-new-admin"
                    />
                    <Label htmlFor="isAdmin">Admin yetkisi ver</Label>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-create-user">
                      {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Oluştur
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>
            Sistemdeki kullanıcıları görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı Adı</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Yetki</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.companyName}</TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <Badge variant="default" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <UserIcon className="h-3 w-3" />
                          Kullanıcı
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openResetPasswordDialog(user.id)}
                          title="Şifre Sıfırla"
                          data-testid={`button-reset-password-${user.id}`}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`${user.fullName} kullanıcısını silmek istediğinize emin misiniz?`)) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }}
                          title="Kullanıcıyı Sil"
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">Henüz kullanıcı yok</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şifre Sıfırla</DialogTitle>
            <DialogDescription>
              Kullanıcı için yeni bir şifre belirleyin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Yeni Şifre</Label>
              <Input
                id="newPassword"
                type="password"
                data-testid="input-reset-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                required
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={resetPasswordMutation.isPending} data-testid="button-confirm-reset">
                {resetPasswordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Şifreyi Güncelle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <form onSubmit={handleSubmitSettings}>
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

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <Label htmlFor="emailApiKey">Resend API Anahtarı</Label>
              </div>
              <Input
                id="emailApiKey"
                type="password"
                data-testid="input-admin-email-api-key"
                placeholder={settings?.emailApiKey ? "••••••••••••" : "re_xxxxxxxxxxxx"}
                value={emailApiKey}
                onChange={(e) => setEmailApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                E-posta göndermek için Resend API anahtarı gerekli.{" "}
                <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  resend.com
                </a>{" "}
                adresinden ücretsiz hesap oluşturabilirsiniz.
                {settings?.emailApiKey && (
                  <span className="ml-2 text-green-600 dark:text-green-400">
                    (Mevcut anahtar kayıtlı - değiştirmek için yeni anahtar girin)
                  </span>
                )}
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                data-testid="button-save-admin"
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
