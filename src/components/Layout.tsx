import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Car, LayoutDashboard, Users, UserCircle, Wallet, Settings as SettingsIcon, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/course", label: "Lancer course", icon: Play },
  { to: "/chauffeurs", label: "Chauffeurs", icon: Car },
  { to: "/clients", label: "Clients", icon: UserCircle },
  { to: "/paiements", label: "Paiements", icon: Wallet },
  { to: "/admin", label: "Admin", icon: SettingsIcon },
];

export function Layout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-5 border-b">
          <h1 className="text-xl font-bold tracking-tight">TAXI PROXI</h1>
          <p className="text-xs text-muted-foreground">DEUS Corporation</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = path === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 text-xs text-muted-foreground border-t">
          Yaoundé, Cameroun
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
