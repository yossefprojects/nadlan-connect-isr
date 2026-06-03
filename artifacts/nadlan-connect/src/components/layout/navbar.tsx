import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import { useLanguage } from "./language-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe, LogOut, Menu, UserCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [location] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { role, profile } = useUserRole();
  const { language, setLanguage } = useLanguage();

  const navItems = [
    { label: "Accueil", href: "/" },
    { label: "Propriétés", href: "/listings" },
  ];

  if (isAuthenticated) {
    if (role === "buyer") {
      navItems.push({ label: "Favoris", href: "/favorites" });
      navItems.push({ label: "Mes Demandes", href: "/leads" });
    } else if (role === "agent" || role === "developer") {
      navItems.push({ label: "Dashboard", href: "/dashboard" });
    } else if (role === "admin") {
      navItems.push({ label: "Admin", href: "/admin" });
    }
  }

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-sm font-medium transition-colors ${
            location === item.href
              ? "text-[#C9A84C] border-b-2 border-[#C9A84C]"
              : "text-white/75 hover:text-white"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1A3A5C] shadow-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2.5">
            <img src="/favicon.png" alt="NadlanConnect" className="h-8 w-8 rounded-lg" />
            <span className="font-serif text-xl tracking-tight text-white">
              NadlanConnect
            </span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10">
                <Globe className="h-4 w-4" />
                <span className="sr-only">Changer de langue</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage("fr")} className={language === "fr" ? "bg-accent/10 text-accent font-medium" : ""}>
                Français
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("en")} className={language === "en" ? "bg-accent/10 text-accent font-medium" : ""}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("he")} className={language === "he" ? "bg-accent/10 text-accent font-medium" : ""}>
                עברית
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-white/80 hover:text-white hover:bg-white/10 border border-white/20">
                    <UserCircle className="h-4 w-4" />
                    <span className="max-w-[100px] truncate">{profile?.fullName || "Mon compte"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button className="bg-[#C9A84C] hover:bg-[#b8963e] text-white border-0">
                  Connexion
                </Button>
              </Link>
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] sm:w-[350px] bg-[#1A3A5C] border-white/10">
              <div className="flex flex-col gap-6 py-6">
                <Link href="/" className="flex items-center space-x-2.5">
                  <img src="/favicon.png" alt="NadlanConnect" className="h-8 w-8 rounded-lg" />
                  <span className="font-serif text-xl tracking-tight text-white">
                    NadlanConnect
                  </span>
                </Link>
                <nav className="flex flex-col gap-4">
                  <NavLinks />
                </nav>
                <div className="border-t border-white/10 pt-4">
                  {isAuthenticated ? (
                    <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10" onClick={() => logout()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </Button>
                  ) : (
                    <Link href="/auth" className="block w-full">
                      <Button className="w-full bg-[#C9A84C] hover:bg-[#b8963e] text-white border-0">Connexion</Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
