// Google Analytics 4 loader — inert unless VITE_GA_ID is configured at build
// time (e.g. VITE_GA_ID=G-XXXXXXXXXX). Keeps analytics out of dev/preview by
// default and avoids shipping a hard-coded measurement id.
export function initAnalytics(): void {
  const id = import.meta.env.VITE_GA_ID as string | undefined;
  if (!id || typeof document === "undefined") return;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  function gtag(...args: unknown[]) {
    w.dataLayer.push(args);
  }
  w.gtag = gtag;
  gtag("js", new Date());
  gtag("config", id, { anonymize_ip: true });
}
