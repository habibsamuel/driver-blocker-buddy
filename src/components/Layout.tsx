import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, UserCircle, Wallet, Settings as SettingsIcon, Play, Menu, ChevronDown, Lock, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore, type Role } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

// ✅ FIXED: Chauffeurs & Clients now ADMIN ONLY
const allNav = [
  { to: "/", label: "Accueil", icon: LayoutDashboard, roles: ["client", "chauffeur", "admin"] as Role[] },
  { to: "/course", label: "Réserver une course", icon: Play, roles: ["client", "chauffeur", "admin"] as Role[] },
  { to: "/chauffeurs", label: "Chauffeurs", icon: Users, roles: ["admin"] as Role[] }, // ✅ ADMIN ONLY
  { to: "/clients", label: "Clients", icon: UserCircle, roles: ["admin"] as Role[] }, // ✅ ADMIN ONLY
  { to: "/paiements", label: "Paiements", icon: Wallet, roles: ["chauffeur", "admin"] as Role[] },
  { to: "/admin", label: "Administration", icon: SettingsIcon, roles: ["admin"] as Role[] },
];

const roleLabel: Record<Role, string> = {
  client: "Client",
  chauffeur: "Chauffeur",
  admin: "Admin",
};

// In-memory admin session flag (cleared on page reload — not persisted)
let adminSessionAuthed = false;

export function Layout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);
  const adminPin = useStore((s) => s.settings.adminPin) || "2468";

  const [pinOpen, setPinOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinAttempts, setPinAttempts] = useState(0);

  // On reload, if persisted role is "admin" but session not authed, downgrade
  useEffect(() => {
    if (role === "admin" && !adminSessionAuthed) {
      setRole("client");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nav = allNav.filter((n) => n.roles.includes(role));
  const current = nav.find((n) => n.to === path) ?? nav[0];

  useEffect(() => {
    if (!allNav.find((n) => n.to === path)?.roles.includes(role)) {
      navigate({ to: "/" });
    }
  }, [role, path, navigate]);

  const handleRoleSwitch = (r: Role) => {
    if (r === "admin") {
      if (adminSessionAuthed) {
        setRole("admin");
        return;
      }
      setPinValue("");
      setPinOpen(true);
      return;
    }
    if (role === "admin") adminSessionAuthed = false;
    setRole(r);
  };

  const handlePinSubmit = () => {
    if (pinAttempts >= 5) {
      toast.error("Trop de tentatives, rechargez la page");
      return;
    }
    if (pinValue === adminPin) {
      adminSessionAuthed = true;
      setRole("admin");
      setPinOpen(false);
      setPinValue("");
      setPinAttempts(0);
      toast.success("Mode administrateur activé");
    } else {
      setPinAttempts((n) => n + 1);
      toast.error("Code PIN incorrect");
      setPinValue("");
    }
  };

  const handleLogoutAdmin = () => {
    adminSessionAuthed = false;
    setRole("client");
    toast.success("Session admin fermée");
  };

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

          <div className="flex items-center gap-2">
            <AuthHeader />
            {role === "admin" && (
              <Badge className="hidden sm:flex bg-primary text-primary-foreground gap-1">
                <Lock className="h-3 w-3" /> Admin
              </Badge>
            )}
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
                <DropdownMenuLabel className="text-xs text-muted-foreground">Profil</DropdownMenuLabel>
                {(["client", "chauffeur"] as Role[]).map((r) => (
                  <DropdownMenuItem
                    key={r}
                    className={cn("cursor-pointer", role === r && "bg-accent font-semibold")}
                    onClick={() => handleRoleSwitch(r)}
                  >
                    {roleLabel[r]}
                    {role === r && <Badge className="ml-auto bg-primary text-primary-foreground">actif</Badge>}
                  </DropdownMenuItem>
                ))}
                {role === "admin" && (
                  <DropdownMenuItem className="cursor-pointer text-destructive" onClick={handleLogoutAdmin}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Quitter mode admin
                  </DropdownMenuItem>
                )}
                {role === "chauffeur" && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleRoleSwitch("admin")}>
                    <Lock className="h-4 w-4 mr-2" />
                    Mode administrateur…
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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

      <Dialog open={pinOpen} onOpenChange={(o) => { setPinOpen(o); if (!o) setPinValue(""); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Accès administrateur
            </DialogTitle>
            <DialogDescription>
              Entrez le code PIN à 4 chiffres pour activer le mode admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pin">Code PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
              placeholder="••••"
              className="text-center tracking-[0.5em] text-lg font-bold"
            />
            {pinAttempts > 0 && (
              <p className="text-xs text-destructive">Tentatives échouées: {pinAttempts}/5</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPinOpen(false)}>Annuler</Button>
            <Button onClick={handlePinSubmit} className="bg-primary text-primary-foreground">Valider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster richColors position="top-right" />
    </div>
  );
}

function AuthHeader() {
  const { user, roles, isOnlineDriver, setOnlineDriver, signOut } = useAuth();
  if (!user) {
    return (
      <Link to="/auth">
        <Button size="sm" variant="outline" className="text-xs">Connexion</Button>
      </Link>
    );
  }
  const isDriver = roles.includes("chauffeur");
  return (
    <div className="flex items-center gap-2">
      {isDriver && (
        <div className="hidden sm:flex items-center gap-2 bg-secondary-foreground/10 rounded-full px-3 py-1">
          <span className="text-[10px] uppercase tracking-wider">{isOnlineDriver ? "En ligne" : "Hors ligne"}</span>
          <Switch
            checked={isOnlineDriver}
            onCheckedChange={(v) => {
              setOnlineDriver(v);
              if (v) toast.success("Vous êtes en ligne — partage GPS activé");
            }}
          />
        </div>
      )}
      <Button size="sm" variant="ghost" onClick={signOut} className="text-xs">
        <LogOut className="h-3 w-3" />
      </Button>
    </div>
  );
}
