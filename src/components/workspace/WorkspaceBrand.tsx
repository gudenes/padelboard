import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
export function WorkspaceBrand({ href = "/" }: { href?: string }) {
  const t = useTranslations("workspace");
  return (
    <Link href={href} className="pbw-logo" aria-label={t("brandHomeAria")}>
      padelboard
      <span className="pbw-logo-score">
        <sup>6</sup>/<sub>4</sub>
      </span>
    </Link>
  );
}
