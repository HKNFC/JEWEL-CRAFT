import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, loginPending } = useAuth();
  const { toast } = useToast();

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginForm);
      toast({ title: "Giriş başarılı", description: "Hoş geldiniz!" });
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Giriş başarısız",
        description: error?.message || "Kullanıcı adı veya şifre hatalı",
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
          <CardDescription>Hesabınıza giriş yapın</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
