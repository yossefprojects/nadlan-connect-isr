import { LegalPage } from "@/components/legal-page";
import { MENTIONS } from "@/lib/legal-content";

export default function MentionsLegales() {
  return <LegalPage docByLang={MENTIONS} />;
}
