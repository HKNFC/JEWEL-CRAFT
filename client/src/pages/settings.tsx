import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Lock } from "lucide-react";

export default function SettingsPage() {
  const { user, updateProfile, updateProfilePending, changePassword, changePasswordPending } = useAuth();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({
    companyName: user?.companyName || "",
    fullName: user?.fullName || "",
    email: user?.email || "",
    emailFromAddress: user?.emailFromAddress || "",
    gender: user?.gender || "male",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      toast({ title: "Profil güncellendi" });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error?.message || "Profil güncellenemedi",
        variant: "destructive",
      });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Hata",
        description: "Yeni şifreler eşleşmiyor",
        variant: "destructive",
      });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Hata",
        description: "Yeni şifre en az 6 karakter olmalı",
        variant: "destructive",
      });
      return;
    }
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast({ title: "Şifre değiştirildi" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error?.message || "Şifre değiştirilemedi",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ayarlar</h1>
        <p className="text-muted-foreground">Hesap ayarlarınızı yönetin</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Profil Bilgileri</CardTitle>
          </div>
          <CardDescription>Firma ve kişisel bilgilerinizi güncelleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Firma Adı</Label>
                <Input
                  id="companyName"
                  data-testid="input-settings-company"
                  value={profileForm.companyName}
                  onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input
                  id="fullName"
                  data-testid="input-settings-fullname"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="input-settings-email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailFromAddress">Gönderen E-posta Adresi</Label>
                <Input
                  id="emailFromAddress"
                  data-testid="input-settings-from-email"
                  placeholder="ornek@sirketiniz.com"
                  value={profileForm.emailFromAddress}
                  onChange={(e) => setProfileForm({ ...profileForm, emailFromAddress: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Cinsiyet</Label>
              <Select
                value={profileForm.gender}
                onValueChange={(value) => setProfileForm({ ...profileForm, gender: value })}
              >
                <SelectTrigger id="gender" data-testid="select-gender">
                  <SelectValue placeholder="Cinsiyet seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Erkek</SelectItem>
                  <SelectItem value="female">Kadın</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={updateProfilePending} data-testid="button-save-profile">
              {updateProfilePending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Kaydet
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Şifre Değiştir</CardTitle>
          </div>
          <CardDescription>Hesap şifrenizi güncelleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mevcut Şifre</Label>
              <Input
                id="currentPassword"
                type="password"
                data-testid="input-current-password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Yeni Şifre</Label>
                <Input
                  id="newPassword"
                  type="password"
                  data-testid="input-new-password"
                  placeholder="En az 6 karakter"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  data-testid="input-confirm-password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={changePasswordPending} data-testid="button-change-password">
              {changePasswordPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Şifreyi Değiştir
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
