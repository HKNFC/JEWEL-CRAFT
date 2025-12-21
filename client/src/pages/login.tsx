import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gem, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, register, loginPending, registerPending } = useAuth();
  const { toast } = useToast();

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    companyName: "",
    username: "",
    password: "",
    fullName: "",
    email: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginForm);
      toast({ title: "Giriş başarılı", description: "Hoş geldiniz!" });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Giriş başarısız",
        description: error?.message || "Kullanıcı adı veya şifre hatalı",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password.length < 6) {
      toast({
        title: "Hata",
        description: "Şifre en az 6 karakter olmalı",
        variant: "destructive",
      });
      return;
    }
    try {
      await register(registerForm);
      toast({ title: "Kayıt başarılı", description: "Hoş geldiniz!" });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Kayıt başarısız",
        description: error?.message || "Bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Gem className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Mücevher Maliyet Analizi</CardTitle>
          <CardDescription>Hesabınıza giriş yapın veya yeni hesap oluşturun</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Giriş</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Kayıt</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Kullanıcı Adı</Label>
                  <Input
                    id="login-username"
                    data-testid="input-login-username"
                    placeholder="Kullanıcı adınızı girin"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Şifre</Label>
                  <Input
                    id="login-password"
                    type="password"
                    data-testid="input-login-password"
                    placeholder="Şifrenizi girin"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loginPending} data-testid="button-login">
                  {loginPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Giriş Yap
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-company">Firma Adı *</Label>
                  <Input
                    id="register-company"
                    data-testid="input-register-company"
                    placeholder="Firma adınızı girin"
                    value={registerForm.companyName}
                    onChange={(e) => setRegisterForm({ ...registerForm, companyName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-username">Kullanıcı Adı *</Label>
                  <Input
                    id="register-username"
                    data-testid="input-register-username"
                    placeholder="Kullanıcı adı seçin"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Şifre *</Label>
                  <Input
                    id="register-password"
                    type="password"
                    data-testid="input-register-password"
                    placeholder="En az 6 karakter"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-fullname">Ad Soyad</Label>
                  <Input
                    id="register-fullname"
                    data-testid="input-register-fullname"
                    placeholder="İsteğe bağlı"
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">E-posta</Label>
                  <Input
                    id="register-email"
                    type="email"
                    data-testid="input-register-email"
                    placeholder="İsteğe bağlı"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={registerPending} data-testid="button-register">
                  {registerPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Hesap Oluştur
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
