import { ownedMatch } from "@/lib/owned-match";
import { MatchInsights } from "@/components/workspace/MatchInsights";
export default async function Insights({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <MatchInsights initial={await ownedMatch(code)} />;
}
