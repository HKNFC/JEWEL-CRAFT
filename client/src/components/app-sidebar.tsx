import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Factory, 
  Gem, 
  ListOrdered, 
  FileText,
  DollarSign,
  Diamond,
  Package,
  Percent,
  Settings,
  LogOut,
  Loader2,
  Shield
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Üreticiler",
    url: "/manufacturers",
    icon: Factory,
  },
  {
    title: "Mıhlama Listesi",
    url: "/stone-rates",
    icon: ListOrdered,
  },
  {
    title: "Taş Fiyatları",
    url: "/gemstone-prices",
    icon: Gem,
  },
  {
    title: "Döviz/Altın",
    url: "/exchange-rates",
    icon: DollarSign,
  },
  {
    title: "Rapaport",
    url: "/rapaport",
    icon: Diamond,
  },
  {
    title: "Rapaport İndirim",
    url: "/rapaport-discount-rates",
    icon: Percent,
  },
  {
    title: "Analiz Kayıtları",
    url: "/analysis",
    icon: FileText,
  },
  {
    title: "Rapor",
    url: "/batches",
    icon: Package,
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout, logoutPending } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <Gem className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Mücevher Analiz</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Yönetim</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`link-${item.url.replace("/", "") || "dashboard"}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        {user && (
          <div className="space-y-3">
            <div className="text-sm">
              <p className="font-medium truncate">{user.companyName}</p>
              <p className="text-muted-foreground text-xs truncate">{user.username}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start"
                asChild
              >
                <Link href="/settings" data-testid="link-settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Ayarlar
                </Link>
              </Button>
              {user.isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start"
                  asChild
                >
                  <Link href="/admin" data-testid="link-admin">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                disabled={logoutPending}
                data-testid="button-logout"
              >
                {logoutPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
