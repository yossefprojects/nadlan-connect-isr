import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import { useLanguage } from "./language-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe, LogOut, Menu, UserCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IsraelFlag } from "./israel-flag";

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

  const navItems = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.properties"), href: "/listings" },
    { label: t("nav.developers"), href: "/promoteurs" },
    { label: t("nav.demolition"), href: "/demolition/listings" },
    { label: t("nav.aiAnalysis"), href: "/outils/analyse-ia" },
  ];

  if (isAuthenticated) {
    navItems.push({ label: t("nav.myReports"), href: "/outils/mes-rapports" });
    if (role === "buyer") {
      navItems.push({ label: t("nav.favorites"), href: "/favorites" });
      navItems.push({ label: t("nav.myLeads"), href: "/leads" });
    } else if (role === "agent" || role === "developer") {
      navItems.push({ label: t("nav.dashboard"), href: "/dashboard" });
    } else if (role === "admin") {
      navItems.push({ label: t("nav.admin"), href: "/admin" });
    }
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
            className={`relative whitespace-nowrap text-sm font-medium transition-colors hover:text-white px-1 py-2 ${
              isActive ? "text-white" : (scrolled || !isHome ? "text-white/70" : "text-white/80")
            }`}
          >
            {item.label}
            {isActive && (
              <motion.div
                layoutId="navbar-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A84C]"
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
          ? "bg-[#0A1628]/80 backdrop-blur-md border-b border-white/10 shadow-sm"
          : isHome 
            ? "bg-transparent border-b border-transparent"
            : "bg-[#0A1628] border-b border-white/10"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="h-8 w-8 rounded overflow-hidden relative">
               <img src="/favicon.png" alt="NadlanConnect" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </div>
            <span className="relative inline-block font-serif text-xl tracking-tight text-white transition-opacity group-hover:opacity-90">
              Nadlan<span className="text-[#C9A84C]">Connect</span>
              <IsraelFlag className="absolute -bottom-1 -right-4 h-[15px] w-5 rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.35)] ring-1 ring-black/5" />
            </span>
          </Link>
          <nav className="hidden lg:flex gap-8">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 px-0 text-white/70 hover:text-white hover:bg-white/10 rounded-full">
                <Globe className="h-4 w-4" />
                <span className="sr-only">{t("nav.changeLanguage")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0A1628] text-white border-white/10">
              <DropdownMenuItem onClick={() => setLanguage("fr")} className={`hover:bg-white/10 focus:bg-white/10 cursor-pointer ${language === "fr" ? "text-[#C9A84C]" : ""}`}>
                Français
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("en")} className={`hover:bg-white/10 focus:bg-white/10 cursor-pointer ${language === "en" ? "text-[#C9A84C]" : ""}`}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("he")} className={`hover:bg-white/10 focus:bg-white/10 cursor-pointer ${language === "he" ? "text-[#C9A84C]" : ""}`}>
                עברית
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-white/80 hover:text-white hover:bg-white/10 border border-white/20 rounded-full h-9 px-4 transition-all">
                    <UserCircle className="h-4 w-4" />
                    <span className="max-w-[120px] truncate text-sm font-medium">{profile?.fullName || t("nav.account")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0A1628] text-white border-white/10">
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-white/10 focus:bg-white/10 hover:text-red-300 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login">
                <Button className="h-9 px-6 rounded-full bg-[#C9A84C] hover:bg-[#E8C96A] text-[#0A1628] font-bold shadow-[0_4px_14px_rgba(201,168,76,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(201,168,76,0.4)] border-0">
                  {t("nav.login")}
                </Button>
              </Link>
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-white/80 hover:text-white hover:bg-white/10 rounded-full h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("nav.menu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[350px] bg-[#0A1628]/95 backdrop-blur-xl border-white/10 p-0 text-white">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-white/10">
                  <Link href="/" className="flex items-center space-x-2.5">
                    <img src="/favicon.png" alt="NadlanConnect" className="h-8 w-8 rounded" />
                    <span className="relative inline-block font-serif text-xl tracking-tight text-white">
                      Nadlan<span className="text-[#C9A84C]">Connect</span>
                      <IsraelFlag className="absolute -bottom-1 -right-4 h-[15px] w-5 rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.35)] ring-1 ring-black/5" />
                    </span>
                  </Link>
                </div>
                
                <nav className="flex flex-col px-6 py-8 gap-6 flex-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-lg font-medium transition-colors ${
                        location === item.href ? "text-[#C9A84C]" : "text-white/70 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                
                <div className="p-6 border-t border-white/10 mt-auto">
                  {isAuthenticated ? (
                    <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 h-12 rounded-xl text-base" onClick={handleLogout}>
                      <LogOut className="mr-3 h-5 w-5" />
                      {t("nav.logout")}
                    </Button>
                  ) : (
                    <Link href="/auth/login" className="block w-full">
                      <Button className="w-full h-12 bg-gradient-to-r from-[#C9A84C] to-[#E8C96A] hover:opacity-90 text-[#0A1628] font-bold text-base rounded-xl border-0 shadow-lg">
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
