import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { localeAlternates } from "@/lib/seo";
import { PlayfulHome } from "@/components/home/PlayfulHome";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { languages: localeAlternates("/") },
  };
}

export default function Home() {
  const liveAvailable = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_KEY,
  );
  return (
    <PlayfulHome
      liveAvailable={liveAvailable}
      aiAvailable={Boolean(process.env.OPENAI_API_KEY)}
    />
  );
}
