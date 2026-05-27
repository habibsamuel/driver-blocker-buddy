import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, UserCircle, Wallet, Settings as SettingsIcon, Play, Menu, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore, type Role } from "@/lib/store";

const allNav = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard, roles: ["client", "chauffeur", "admin"] as Role[] },
  { to: "/course", label: "Réserver une course", icon: Play, roles: ["client", "chauffeur", "admin"] as Role[] },
  { to: "/chauffeurs", label: "Chauffeurs", icon: Users, roles: ["client", "admin"] as Role[] },
  { to: "/clients", label: "Clients", icon: UserCircle, roles: ["chauffeur", "admin"] as Role[] },
  { to: "/paiements", label: "Paiements", icon: Wallet, roles: ["chauffeur", "admin"] as Role[] },
  { to: "/admin", label: "Administration", icon: SettingsIcon, roles: ["admin"] as Role[] },
];

const roleLabel: Record<Role, string> = {
  client: "Client",
  chauffeur: "Chauffeur",
  admin: "Admin",
};

export function Layout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);

  const nav = allNav.filter((n) => n.roles.includes(role));
  const current = nav.find((n) => n.to === path) ?? nav[0];

  // Redirige si rôle n'a pas accès à la route courante
  useEffect(() => {
    if (!allNav.find((n) => n.to === path)?.roles.includes(role)) {
      navigate({ to: "/" });
    }
  }, [role, path, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-secondary text-secondary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-3xl group-hover:scale-110 transition-transform">🚖</span>
            <div className="leading-tight">
              <h1 className="text-lg font-black tracking-tight text-primary">TAXI PROXI</h1>
              <p className="text-[10px] text-secondary-foreground/60 uppercase tracking-widest">Covoiturage Yaoundé</p>
            </div>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 bg-secondary-foreground/10 hover:bg-primary hover:text-primary-foreground text-secondary-foreground border border-secondary-foreground/10"
              >
                <Menu className="h-4 w-4" />
                <span className="hidden sm:inline font-semibold">{current?.label ?? "Menu"}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Navigation</DropdownMenuLabel>
              {nav.map((n) => {
                const Icon = n.icon;
                const active = path === n.to;
                return (
                  <DropdownMenuItem
                    key={n.to}
                    asChild
                    className={cn("cursor-pointer", active && "bg-primary/20 font-semibold")}
                  >
                    <Link to={n.to} className="flex items-center gap-3 w-full">
                      <Icon className="h-4 w-4" />
                      {n.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Voir en tant que</DropdownMenuLabel>
              {(["client", "chauffeur", "admin"] as Role[]).map((r) => (
                <DropdownMenuItem
                  key={r}
                  className={cn("cursor-pointer", role === r && "bg-accent font-semibold")}
                  onClick={() => setRole(r)}
                >
                  {roleLabel[r]}
                  {role === r && <Badge className="ml-auto bg-primary text-primary-foreground">actif</Badge>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-border bg-secondary text-secondary-foreground/70 text-xs py-3 text-center">
        🚖 TAXI PROXI · DEUS Corporation · Yaoundé, Cameroun
      </footer>

      <Toaster richColors position="top-right" />
    </div>
  );
}
