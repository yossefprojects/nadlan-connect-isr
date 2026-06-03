import { useGetFeaturedListings, useGetListingsStats } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/layout/language-provider";
import { ArrowRight, Building2, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: featuredListings, isLoading: isFeaturedLoading } = useGetFeaturedListings();
  const { data: stats } = useGetListingsStats();
  const { t } = useLanguage();

  const HERO_STATS = [
    { val: t("home.heroStat1Val"), lbl: t("home.heroStat1") },
    { val: t("home.heroStat2Val"), lbl: t("home.heroStat2") },
    { val: t("home.heroStat3Val"), lbl: t("home.heroStat3") },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section
        className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-16 text-center"
        style={{
          background: "linear-gradient(160deg, #0F2235 0%, #1A3A5C 60%, #0F2235 100%)",
          minHeight: 460,
        }}
      >
        {/* Skyline SVG */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1200 200"
            preserveAspectRatio="xMidYMax slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="0" y="80" width="80" height="120" fill="white" />
            <rect x="90" y="40" width="120" height="160" fill="white" />
            <rect x="220" y="60" width="80" height="140" fill="white" />
            <rect x="310" y="20" width="100" height="180" fill="white" />
            <rect x="420" y="50" width="90" height="150" fill="white" />
            <rect x="520" y="30" width="130" height="170" fill="white" />
            <rect x="660" y="55" width="85" height="145" fill="white" />
            <rect x="755" y="15" width="110" height="185" fill="white" />
            <rect x="875" y="65" width="90" height="135" fill="white" />
            <rect x="975" y="35" width="120" height="165" fill="white" />
            <rect x="1105" y="70" width="95" height="130" fill="white" />
          </svg>
        </div>

        {/* Badge eyebrow */}
        <div className="relative mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/15 px-3.5 py-1.5">
          <span className="text-sm">🇮🇱</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C9A84C]">
            {t("home.eyebrow")}
          </span>
        </div>

        {/* Title */}
        <h1 className="relative mb-4 max-w-3xl font-serif font-normal leading-tight text-white" style={{ fontSize: "clamp(28px, 5vw, 48px)" }}>
          {t("home.titleLine1")}
          <br />
          <span className="text-[#C9A84C]">{t("home.titleHighlight")}</span>
        </h1>

        {/* Subtitle */}
        <p className="relative mb-7 max-w-xl text-[15px] leading-relaxed text-[#85B7EB]">
          {t("home.subtitle")}
        </p>

        {/* CTAs */}
        <div className="relative mb-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/listings">
            <Button className="rounded-full bg-[#C9A84C] px-7 py-6 text-sm font-bold text-[#0F2235] hover:bg-[#b8963e]">
              {t("home.exploreCta")} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth">
            <Button
              variant="outline"
              className="rounded-full border-white/30 bg-white/10 px-7 py-6 text-sm font-semibold text-white hover:bg-white/20 hover:text-white"
            >
              {t("home.partnerCta")} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="relative flex justify-center gap-10">
          {HERO_STATS.map((s) => (
            <div key={s.lbl} className="text-center">
              <div className="text-xl font-bold text-[#C9A84C]">{s.val}</div>
              <div className="mt-0.5 text-[11px] text-[#9CABBF]">{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50 border-y">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 bg-background p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{stats?.totalListings || 0}</div>
                <div className="text-sm text-muted-foreground font-medium">{t("home.statExclusive")}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-background p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{t("home.statDataDriven")}</div>
                <div className="text-sm text-muted-foreground font-medium">{t("home.statDataDrivenSub")}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-background p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{t("home.statProNetwork")}</div>
                <div className="text-sm text-muted-foreground font-medium">{t("home.statProNetworkSub")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-serif text-3xl font-bold text-primary mb-2">{t("home.featuredTitle")}</h2>
              <p className="text-muted-foreground">{t("home.featuredSubtitle")}</p>
            </div>
            <Link href="/listings">
              <Button variant="ghost" className="text-primary hover:text-primary/80 group">
                {t("home.viewAll")} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          
          {isFeaturedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[400px] bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings?.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}