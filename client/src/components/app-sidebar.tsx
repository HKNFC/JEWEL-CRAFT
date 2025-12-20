import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  Factory, 
  Gem, 
  ListOrdered, 
  FileText,
  DollarSign,
  Diamond,
  Package
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
} from "@/components/ui/sidebar";

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
    title: "Analiz Kayıtları",
    url: "/analysis",
    icon: FileText,
  },
  {
    title: "Parti Listesi",
    url: "/batches",
    icon: Package,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

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
    </Sidebar>
  );
}
