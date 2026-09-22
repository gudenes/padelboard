import { redirect } from "next/navigation";
export default async function LegacyMatchPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/m/${encodeURIComponent(code)}?view=insights`);
}
