import { useState } from "react";
import { useGetFeaturedListings } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/layout/language-provider";
import { ArrowRight, Building2, Search, Brain, Handshake, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import abstractAi from "@/assets/ai-abstract.png";
import abstractAiWebp from "@/assets/ai-abstract.webp";
import proNetwork from "@/assets/pro-network.png";
import proNetworkWebp from "@/assets/pro-network.webp";
import { usePageMeta } from "@/hooks/use-page-meta";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const CITIES = [
  { v: "tlv", l: "Tel Aviv" },
  { v: "jer", l: "Jérusalem" },
  { v: "hfa", l: "Haïfa" },
  { v: "nat", l: "Netanya" },
  { v: "ash", l: "Ashdod" },
  { v: "bs", l: "Beer-Sheva" },
];

const BUDGETS = ["2000000", "4000000", "6000000", "10000000"];

export default function Home() {
  const { data: featuredListings, isLoading: isFeaturedLoading } = useGetFeaturedListings();
  const { t, dir } = useLanguage();
  const [, navigate] = useLocation();

  const isRtl = dir === "rtl";

  const [ville, setVille] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (ville) params.set("ville", ville);
    if (type) params.set("type", type);
    if (budget) params.set("maxPrice", budget);
    const qs = params.toString();
    navigate(qs ? `/listings?${qs}` : "/listings");
  };

  usePageMeta({
    title: "NadlanConnect — Immobilier Premium en Israël",
    description: "Achetez, investissez et trouvez les meilleures propriétés en Israël. Annonces exclusives à Tel Aviv, Jérusalem, Haïfa et partout en Israël — estimation IA, score d'investissement, connexion directe avec promoteurs et agences.",
  });

  const HERO_STATS = [
    { val: t("home.heroStat1Val"), lbl: t("home.heroStat1") },
    { val: t("home.heroStat2Val"), lbl: t("home.heroStat2") },
    { val: t("home.heroStat3Val"), lbl: t("home.heroStat3") },
  ];

  const fmtBudget = (v: string) => `${(Number(v) / 1_000_000).toLocaleString(dir === "rtl" ? "he-IL" : "fr-FR")} M ₪`;

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      {/* Hero — light editorial with data-driven search */}
      <section className="relative overflow-hidden bg-background pt-32 pb-16 md:pt-36 md:pb-20">
        <div className="pointer-events-none absolute -top-24 right-0 rtl:right-auto rtl:left-0 h-80 w-80 rounded-full bg-sea/10 blur-[120px]" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <div className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-sea">
              {t("home.eyebrow")}
            </div>
            <h1 className="font-serif text-[clamp(38px,5.6vw,68px)] font-medium leading-[1.04] tracking-tight text-foreground">
              {t("home.titleConnect")}
              <br />
              <span className="italic text-sea">{t("home.titleLine1")}</span>{" "}
              {t("home.titleHighlight")}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              {t("home.subtitlePro")}
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex max-w-3xl flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2.5 shadow-[0_18px_40px_-28px_rgba(14,27,42,0.4)]"
          >
            <div className="flex min-w-[150px] flex-1 flex-col gap-0.5 px-3.5 py-1.5 border-border sm:border-e">
              <label htmlFor="s-ville" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t("home.searchVille")}</label>
              <select id="s-ville" value={ville} onChange={(e) => setVille(e.target.value)} className="bg-transparent text-sm font-medium text-foreground outline-none">
                <option value="">{t("home.searchAny")}</option>
                {CITIES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
              </select>
            </div>
            <div className="flex min-w-[150px] flex-1 flex-col gap-0.5 px-3.5 py-1.5 border-border sm:border-e">
              <label htmlFor="s-type" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t("home.searchType")}</label>
              <select id="s-type" value={type} onChange={(e) => setType(e.target.value)} className="bg-transparent text-sm font-medium text-foreground outline-none">
                <option value="">{t("home.searchAny")}</option>
                <option value="new_development">{t("listings.newDev")}</option>
                <option value="resale">{t("listings.resale")}</option>
              </select>
            </div>
            <div className="flex min-w-[150px] flex-1 flex-col gap-0.5 px-3.5 py-1.5">
              <label htmlFor="s-budget" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t("home.searchBudget")}</label>
              <select id="s-budget" value={budget} onChange={(e) => setBudget(e.target.value)} className="bg-transparent text-sm font-medium text-foreground outline-none">
                <option value="">{t("home.searchAny")}</option>
                {BUDGETS.map((b) => <option key={b} value={b}>{fmtBudget(b)}</option>)}
              </select>
            </div>
            <Button type="submit" className="h-12 w-full rounded-xl bg-primary px-6 font-semibold text-primary-foreground hover:bg-ink-2 sm:w-auto">
              <Search className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
              {t("home.searchCta")}
            </Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-7 flex flex-wrap items-center gap-x-9 gap-y-3"
          >
            {HERO_STATS.map((s, i) => (
              <div key={i} className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-semibold text-foreground">{s.val}</span>
                <span className="text-sm text-muted-foreground">{s.lbl}</span>
              </div>
            ))}
            <Link href="/auth/register" className="ms-auto hidden items-center gap-1.5 text-sm font-semibold text-sea hover:underline sm:inline-flex">
              {t("home.partnerCta")}
              <ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 md:py-28 bg-background relative">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="font-mono text-xs font-semibold tracking-[0.14em] text-sea uppercase mb-4">
              {t("home.processEyebrow")}
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground leading-tight">
              {t("home.processTitle")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Building2 className="h-7 w-7" />, title: t("home.step1Title"), desc: t("home.step1Desc"), cardClass: "bg-foreground shadow-xl", textClass: "text-background", iconWrap: "bg-white/10 text-white" },
              { icon: <Handshake className="h-7 w-7" />, title: t("home.step2Title"), desc: t("home.step2Desc"), cardClass: "bg-card border border-border shadow-sm", textClass: "text-foreground", iconWrap: "bg-sea/10 text-sea" },
              { icon: <Search className="h-7 w-7" />, title: t("home.step3Title"), desc: t("home.step3Desc"), cardClass: "bg-sea shadow-xl", textClass: "text-white", iconWrap: "bg-white/20 text-white" },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.15 } }
                }}
                className={`relative p-9 rounded-3xl flex flex-col h-full ${step.cardClass} group transition-transform duration-300 hover:-translate-y-2`}
              >
                <div className={`absolute top-7 ${isRtl ? 'left-7' : 'right-7'} font-serif text-[110px] font-bold opacity-[0.04] leading-none pointer-events-none select-none ${step.textClass}`}>
                  0{i + 1}
                </div>
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-7 ${step.iconWrap}`}>
                  {step.icon}
                </div>
                <h3 className={`font-serif text-2xl mb-3 ${step.textClass}`}>
                  {step.title}
                </h3>
                <p className={`text-base leading-relaxed ${step.textClass} opacity-80 mt-auto`}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Section — deliberate dark "data" band */}
      <section className="py-24 md:py-28 bg-foreground text-white relative overflow-hidden">
        <div className="absolute inset-0 md:w-1/2 w-full h-1/2 md:h-full rtl:right-0 rtl:left-auto">
          <picture>
            <source srcSet={abstractAiWebp} type="image/webp" />
            <img src={abstractAi} alt={t("home.aiImageAlt")} loading="lazy" decoding="async" className="w-full h-full object-cover opacity-25 md:opacity-40" />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r rtl:md:bg-gradient-to-l from-[#0E1B2A] via-[#0E1B2A]/85 to-transparent" />
        </div>

        <div className="container relative z-10 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 w-full pt-56 md:pt-0 rtl:md:pr-16 md:pl-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="max-w-xl"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 mb-8">
                <Brain className="h-4 w-4 text-gold" />
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                  {t("home.aiEyebrow")}
                </span>
              </motion.div>

              <motion.h2 variants={fadeInUp} className="font-serif text-4xl md:text-6xl font-medium text-white mb-6">
                {t("home.aiTitle")}
              </motion.h2>

              <motion.p variants={fadeInUp} className="text-lg text-white/70 mb-10 leading-relaxed">
                {t("home.aiDesc")}
              </motion.p>

              <motion.ul variants={staggerContainer} className="space-y-4 mb-12">
                {[
                  t("analyse.marketEstimate"),
                  t("analyse.urbanPotential"),
                  t("analyse.rentalYield"),
                ].map((feature, i) => (
                  <motion.li key={i} variants={fadeInUp} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-gold" />
                    <span className="text-white/90 font-medium">{feature}</span>
                  </motion.li>
                ))}
              </motion.ul>

              <motion.div variants={fadeInUp}>
                <Link href="/outils/analyse-ia">
                  <Button className="h-14 rounded-full bg-background text-foreground px-8 text-base font-bold hover:bg-background/90 hover:scale-105 transition-transform">
                    {t("home.aiCta")} <ArrowRight className={`h-5 w-5 ${isRtl ? 'rotate-180 mr-2' : 'ml-2'}`} />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-24 md:py-28 bg-background">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="max-w-2xl"
            >
              <div className="font-mono text-xs font-semibold tracking-[0.14em] text-sea uppercase mb-4">
                {t("home.featuredEyebrow")}
              </div>
              <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground mb-4">
                {t("home.featuredTitle")}
              </h2>
              <p className="text-muted-foreground text-lg">
                {t("home.featuredSubtitle")}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Link href="/listings">
                <Button variant="ghost" className="text-foreground hover:bg-foreground/5 group h-12 px-6 rounded-full font-semibold">
                  {t("home.viewAll")} <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 mr-2 group-hover:-translate-x-1' : 'ml-2'}`} />
                </Button>
              </Link>
            </motion.div>
          </div>

          {isFeaturedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[460px] bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
                  <div className="h-[240px] bg-muted animate-pulse" />
                  <div className="p-6 space-y-4 flex-1">
                    <div className="h-6 w-2/3 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                    <div className="mt-auto h-8 w-1/3 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {featuredListings?.map((listing) => (
                <motion.div key={listing.id} variants={fadeInUp}>
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Pro Network closing band */}
      <section className="py-24 bg-card relative overflow-hidden">
         <div className="container relative z-10">
           <div className="bg-foreground rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
              <div className="lg:w-1/2 p-12 lg:p-20 flex flex-col justify-center">
                <div className="font-mono text-xs font-semibold tracking-[0.14em] text-gold uppercase mb-6">
                  {t("home.closingEyebrow")}
                </div>
                <h2 className="font-serif text-3xl md:text-5xl text-white mb-6 leading-tight">
                  {t("home.closingTitle")}
                </h2>
                <p className="text-white/70 text-lg mb-10 leading-relaxed max-w-md">
                  {t("home.closingDesc")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/register">
                    <Button className="h-14 rounded-full bg-gold text-foreground px-8 text-base font-bold shadow-lg hover:scale-105 transition-transform border-0">
                      {t("home.partnerCta")}
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="lg:w-1/2 h-[400px] lg:h-auto relative">
                <picture>
                  <source srcSet={proNetworkWebp} type="image/webp" />
                  <img src={proNetwork} alt={t("home.proImageAlt")} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
                </picture>
              </div>
           </div>
         </div>
      </section>
    </div>
  );
}
