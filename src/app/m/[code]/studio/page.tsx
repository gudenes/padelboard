import { ownedMatch } from "@/lib/owned-match";
import { BrowserStudio } from "@/components/workspace/BrowserStudio";
export default async function Studio({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <BrowserStudio initial={await ownedMatch(code)} />;
}
