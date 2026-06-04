import { useGetFeaturedListings } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/layout/language-provider";
import { ArrowRight, Building2, TrendingUp, Users, Search, Brain, Handshake, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import heroVideo from "@/assets/hero-video.mp4";
import abstractAi from "@/assets/ai-abstract.png";
import proNetwork from "@/assets/pro-network.png";
import luxuryInterior from "@/assets/interior-luxury.png";
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

export default function Home() {
  const { data: featuredListings, isLoading: isFeaturedLoading } = useGetFeaturedListings();
  const { t, dir } = useLanguage();

  const isRtl = dir === "rtl";

  usePageMeta({
    title: "NadlanConnect — Immobilier Premium en Israël",
    description: "Achetez, investissez et trouvez les meilleures propriétés en Israël. Annonces exclusives à Tel Aviv, Jérusalem, Haïfa et partout en Israël — estimation IA, score d'investissement, connexion directe avec promoteurs et agences.",
  });

  const HERO_STATS = [
    { val: t("home.heroStat1Val"), lbl: t("home.heroStat1") },
    { val: t("home.heroStat2Val"), lbl: t("home.heroStat2") },
    { val: t("home.heroStat3Val"), lbl: t("home.heroStat3") },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F7F4] font-sans">
      {/* Hero Section */}
      <section className="relative h-[100svh] min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0 bg-[#0A1628]">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
            poster={luxuryInterior}
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628]/40 via-[#0A1628]/70 to-[#0A1628]/95" />
          
          {/* Subtle animated noise overlay */}
          <div 
            className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay" 
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 container flex flex-col items-center text-center mt-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-1.5 mb-8 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A84C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A84C]"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#E8C96A]">
              {t("home.eyebrow")}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-[clamp(40px,7vw,80px)] leading-[1.05] tracking-tight text-white max-w-4xl mb-6"
          >
            {t("home.titleConnect")}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] to-[#E8C96A]">
              {t("home.titleLine1")}
            </span>{" "}
            {t("home.titleHighlight")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-white/70 max-w-2xl font-light mb-12"
          >
            {t("home.subtitlePro")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
          >
            <Link href="/auth">
              <Button className="w-full sm:w-auto h-14 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8C96A] px-8 text-base font-bold text-[#0A1628] hover:opacity-90 transition-all shadow-[0_8px_30px_rgba(201,168,76,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(201,168,76,0.4)] border-0">
                {t("home.partnerCta")}
                <ArrowRight className={`ml-2 h-5 w-5 ${isRtl ? 'rotate-180 mr-2 ml-0' : ''}`} />
              </Button>
            </Link>
            <Link href="/listings">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-14 rounded-full border-white/20 bg-white/5 backdrop-blur-md px-8 text-base font-semibold text-white hover:bg-white/10 hover:text-white transition-all"
              >
                {t("home.exploreCta")}
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 opacity-60"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" as const }}
        >
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#C9A84C] to-transparent" />
        </motion.div>
      </section>

      {/* Stats Banner */}
      <section className="bg-white border-b border-border/50 py-12 relative z-20 shadow-sm -mt-4 rounded-t-3xl sm:rounded-t-[3rem] overflow-hidden">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50 rtl:divide-x-reverse">
            {HERO_STATS.map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex flex-col items-center text-center py-6 md:py-2"
              >
                <div className="font-serif text-4xl md:text-5xl font-bold text-[#0A1628] mb-2">
                  {s.val}
                </div>
                <div className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  {s.lbl}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 md:py-32 bg-[#F8F7F4] relative">
        <div className="container">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <div className="text-sm font-bold tracking-widest text-[#C9A84C] uppercase mb-4">
              {t("home.processEyebrow")}
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-normal text-[#0A1628] leading-tight">
              {t("home.processTitle")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Building2 className="h-8 w-8" />,
                title: t("home.step1Title"),
                desc: t("home.step1Desc"),
                color: "bg-[#0A1628]",
                textColor: "text-white"
              },
              {
                icon: <Handshake className="h-8 w-8" />,
                title: t("home.step2Title"),
                desc: t("home.step2Desc"),
                color: "bg-white",
                textColor: "text-[#0A1628]",
                border: true
              },
              {
                icon: <Search className="h-8 w-8" />,
                title: t("home.step3Title"),
                desc: t("home.step3Desc"),
                color: "bg-[#C9A84C]",
                textColor: "text-[#0A1628]"
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.2 } }
                }}
                className={`relative p-10 rounded-[2rem] flex flex-col h-full ${step.color} ${step.border ? 'border border-[#E5E7EB] shadow-sm' : 'shadow-xl'} group transition-transform duration-300 hover:-translate-y-2`}
              >
                <div className={`absolute top-8 ${isRtl ? 'left-8' : 'right-8'} font-serif text-[120px] font-bold opacity-[0.03] leading-none pointer-events-none select-none ${step.textColor}`}>
                  0{i + 1}
                </div>
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-8 ${step.color === 'bg-[#0A1628]' ? 'bg-white/10 text-white' : step.color === 'bg-[#C9A84C]' ? 'bg-white/20 text-[#0A1628]' : 'bg-[#0A1628]/5 text-[#0A1628]'}`}>
                  {step.icon}
                </div>
                <h3 className={`font-serif text-2xl mb-4 ${step.textColor}`}>
                  {step.title}
                </h3>
                <p className={`text-base leading-relaxed ${step.textColor} opacity-80 mt-auto`}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-24 md:py-32 bg-[#0A1628] text-white relative overflow-hidden">
        {/* Background image half */}
        <div className="absolute inset-0 md:w-1/2 w-full h-1/2 md:h-full rtl:right-0 rtl:left-auto">
          <img src={abstractAi} alt={t("home.aiImageAlt")} className="w-full h-full object-cover opacity-30 md:opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r rtl:md:bg-gradient-to-l from-[#0A1628] via-[#0A1628]/80 to-transparent" />
        </div>
        
        <div className="container relative z-10 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 w-full pt-64 md:pt-0 rtl:md:pr-16 md:pl-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="max-w-xl"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-1.5 mb-8">
                <Brain className="h-4 w-4 text-[#E8C96A]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#E8C96A]">
                  {t("home.aiEyebrow")}
                </span>
              </motion.div>
              
              <motion.h2 variants={fadeInUp} className="font-serif text-4xl md:text-6xl font-normal text-white mb-6">
                {t("home.aiTitle")}
              </motion.h2>
              
              <motion.p variants={fadeInUp} className="text-lg text-white/70 mb-10 leading-relaxed font-light">
                {t("home.aiDesc")}
              </motion.p>
              
              <motion.ul variants={staggerContainer} className="space-y-4 mb-12">
                {[
                  t("analyse.marketEstimate"),
                  t("analyse.urbanPotential"),
                  t("analyse.rentalYield"),
                ].map((feature, i) => (
                  <motion.li key={i} variants={fadeInUp} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#C9A84C]" />
                    <span className="text-white/90 font-medium">{feature}</span>
                  </motion.li>
                ))}
              </motion.ul>
              
              <motion.div variants={fadeInUp}>
                <Link href="/outils/analyse-ia">
                  <Button className="h-14 rounded-full bg-white text-[#0A1628] px-8 text-base font-bold hover:bg-white/90 hover:scale-105 transition-transform">
                    {t("home.aiCta")} <ArrowRight className={`ml-2 h-5 w-5 ${isRtl ? 'rotate-180 mr-2 ml-0' : ''}`} />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-24 md:py-32 bg-[#F8F7F4]">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="max-w-2xl"
            >
              <div className="text-sm font-bold tracking-widest text-[#C9A84C] uppercase mb-4">
                {t("home.featuredEyebrow")}
              </div>
              <h2 className="font-serif text-4xl md:text-5xl font-normal text-[#0A1628] mb-4">
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
                <Button variant="ghost" className="text-[#0A1628] hover:bg-[#0A1628]/5 group h-12 px-6 rounded-full font-semibold">
                  {t("home.viewAll")} <ArrowRight className={`ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 mr-2 ml-0 group-hover:-translate-x-1' : ''}`} />
                </Button>
              </Link>
            </motion.div>
          </div>
          
          {isFeaturedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[460px] bg-white rounded-[1.5rem] shadow-sm overflow-hidden flex flex-col">
                  <div className="h-[240px] bg-muted/50 animate-pulse" />
                  <div className="p-6 space-y-4 flex-1">
                    <div className="h-6 w-2/3 bg-muted/50 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-muted/50 rounded animate-pulse" />
                    <div className="mt-auto h-8 w-1/3 bg-muted/50 rounded animate-pulse" />
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
              {featuredListings?.map((listing, i) => (
                <motion.div key={listing.id} variants={fadeInUp}>
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Pro Network Section (Image based) */}
      <section className="py-24 bg-white relative overflow-hidden">
         <div className="container relative z-10">
           <div className="bg-[#0A1628] rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
              <div className="lg:w-1/2 p-12 lg:p-20 flex flex-col justify-center">
                <div className="text-[#C9A84C] font-bold text-sm tracking-widest uppercase mb-6">
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
                    <Button className="h-14 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8C96A] text-[#0A1628] px-8 text-base font-bold shadow-[0_4px_14px_rgba(201,168,76,0.3)] hover:scale-105 transition-transform border-0">
                      {t("home.partnerCta")}
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="lg:w-1/2 h-[400px] lg:h-auto relative">
                <img src={proNetwork} alt={t("home.proImageAlt")} className="absolute inset-0 w-full h-full object-cover" />
              </div>
           </div>
         </div>
      </section>
    </div>
  );
}