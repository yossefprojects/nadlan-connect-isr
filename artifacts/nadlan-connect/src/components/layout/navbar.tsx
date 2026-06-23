import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import { useLanguage } from "./language-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe, LogOut, Menu, UserCircle, CreditCard } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Logo } from "./logo";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { role, profile } = useUserRole();
  const { language, setLanguage, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  // Menu tailored per role — each interface (promoteur / apporteur / agence) has
  // its own focused menu instead of the full public browse.
  const items = {
    home: { label: t("nav.home"), href: "/" },
    properties: { label: t("nav.properties"), href: "/listings" },
    programmes: { label: t("nav.programs"), href: "/programmes" },
    developers: { label: t("nav.developers"), href: "/promoteurs" },
    demolition: { label: t("nav.demolition"), href: "/demolition/listings" },
    tarifs: { label: t("nav.pricing"), href: "/tarifs" },
    reports: { label: t("nav.myReports"), href: "/outils/mes-rapports" },
    dashboard: { label: t("nav.dashboard"), href: "/dashboard" },
    mesProjets: { label: t("demo.mesProjets.nav"), href: "/demolition/mes-projets" },
    reventes: { label: t("demo.reventes.nav"), href: "/demolition/reventes" },
    favorites: { label: t("nav.favorites"), href: "/favorites" },
    myLeads: { label: t("nav.myLeads"), href: "/leads" },
    admin: { label: t("nav.admin"), href: "/admin" },
  };

  // Analyse IA is intentionally NOT in the menu — it lives on the pages
  // (home CTA, dashboard, the apporteur/agence workspaces, and the footer).
  let navItems: { label: string; href: string }[];
  if (role === "developer") {
    // Promoteur: browses the market, makes offers, manages a dashboard.
    navItems = [items.home, items.properties, items.programmes, items.demolition, items.reports, items.dashboard];
  } else if (role === "introducer") {
    // Apporteur: focused on their own published projects.
    navItems = [items.home, items.reports, items.mesProjets];
  } else if (role === "agent") {
    // Agence: only the projects entrusted to it for resale.
    navItems = [items.home, items.reports, items.reventes];
  } else if (role === "admin") {
    navItems = [items.home, items.properties, items.programmes, items.developers, items.demolition, items.admin];
  } else if (role === "buyer") {
    navItems = [items.home, items.properties, items.programmes, items.developers, items.demolition, items.tarifs, items.reports, items.favorites, items.myLeads];
  } else {
    // Anonymous visitor.
    navItems = [items.home, items.properties, items.programmes, items.developers, items.demolition, items.tarifs];
  }

  const isHome = location === "/";

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative whitespace-nowrap text-sm font-medium transition-colors hover:text-foreground px-1 py-2 ${
              isActive ? "text-foreground" : "text-foreground/65"
            }`}
          >
            {item.label}
            {isActive && (
              <motion.div
                layoutId="navbar-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sea"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <motion.header
      className={`w-full transition-colors duration-300 ${
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border shadow-sm"
          : isHome
            ? "bg-transparent border-b border-transparent"
            : "bg-background/85 backdrop-blur-md border-b border-border"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="group shrink-0">
            <Logo className="transition-opacity group-hover:opacity-90" />
          </Link>
          <nav className="hidden xl:flex gap-6">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 px-0 text-foreground/65 hover:text-foreground hover:bg-foreground/5 rounded-full">
                <Globe className="h-4 w-4" />
                <span className="sr-only">{t("nav.changeLanguage")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
              <DropdownMenuItem onClick={() => setLanguage("fr")} className={`cursor-pointer ${language === "fr" ? "text-sea font-medium" : ""}`}>
                Français
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("en")} className={`cursor-pointer ${language === "en" ? "text-sea font-medium" : ""}`}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("he")} className={`cursor-pointer ${language === "he" ? "text-sea font-medium" : ""}`}>
                עברית
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden xl:flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-foreground/80 hover:text-foreground hover:bg-foreground/5 border border-border rounded-full h-9 px-4 transition-all">
                    <UserCircle className="h-4 w-4" />
                    <span className="max-w-[120px] truncate text-sm font-medium">{profile?.fullName || t("nav.account")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
                  {(role === "agent" || role === "introducer") && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/abonnement" className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4" />
                        {t("nav.subscription")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login">
                <Button className="h-9 px-6 rounded-full bg-primary hover:bg-ink-2 text-primary-foreground font-semibold shadow-sm transition-all hover:-translate-y-0.5 border-0">
                  {t("nav.login")}
                </Button>
              </Link>
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden text-foreground/80 hover:text-foreground hover:bg-foreground/5 rounded-full h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("nav.menu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[350px] bg-background/95 backdrop-blur-xl border-border p-0 text-foreground">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-border">
                  <Link href="/">
                    <Logo />
                  </Link>
                </div>

                <nav className="flex flex-col px-6 py-8 gap-6 flex-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-lg font-medium transition-colors ${
                        location === item.href ? "text-sea" : "text-foreground/70 hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="p-6 border-t border-border mt-auto">
                  {isAuthenticated ? (
                    <Button variant="ghost" className="w-full justify-start text-foreground/70 hover:text-foreground hover:bg-foreground/5 h-12 rounded-xl text-base" onClick={handleLogout}>
                      <LogOut className="mr-3 h-5 w-5" />
                      {t("nav.logout")}
                    </Button>
                  ) : (
                    <Link href="/auth/login" className="block w-full">
                      <Button className="w-full h-12 bg-primary hover:bg-ink-2 text-primary-foreground font-semibold text-base rounded-xl border-0 shadow-sm">
                        {t("nav.login")}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
