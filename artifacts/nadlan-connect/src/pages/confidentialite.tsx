import { LegalPage } from "@/components/legal-page";
import { CONFIDENTIALITE } from "@/lib/legal-content";

export default function Confidentialite() {
  return <LegalPage docByLang={CONFIDENTIALITE} />;
}
